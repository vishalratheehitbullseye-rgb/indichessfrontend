import React, { useState, useEffect, useRef } from "react";
import BoardLayout from "./BoardLayout";
import GamePlayControlContainer from "./GamePlayControlContainer";

const GameContainer = ({ 
  matchId, 
  stompClient, 
  isConnected, 
  playerColor, 
  initialGameData,
  gameType = 'rapid',
  whiteTimeRemaining: initialWhiteTime = 600,
  blackTimeRemaining: initialBlackTime = 600
}) => {
  const [moves, setMoves] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(playerColor === 'white');
  const [gameStatus, setGameStatus] = useState(initialGameData?.status || "Game started");
  const [opponentMove, setOpponentMove] = useState(null);
  
  // Time state
  const [whiteTime, setWhiteTime] = useState(initialWhiteTime);
  const [blackTime, setBlackTime] = useState(initialBlackTime);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  
  const moveSubscriptionRef = useRef(null);
  const clockTimerRef = useRef(null);

  // Initialize time based on game type
  useEffect(() => {
    if (gameType === 'classical') {
      setWhiteTime(0);
      setBlackTime(0);
    } else if (gameType === 'rapid') {
      setWhiteTime(600);
      setBlackTime(600);
    } else if (gameType === 'blitz') {
      setWhiteTime(300);
      setBlackTime(300);
    } else if (gameType === 'bullet') {
      setWhiteTime(60);
      setBlackTime(60);
    }
    
    setIsWhiteTurn(playerColor === 'white');
    setIsMyTurn(playerColor === 'white');
  }, [gameType, playerColor]);

  // Time management effect
  useEffect(() => {
    if (gameType === 'classical') return;
    
    if (clockTimerRef.current) {
      clearInterval(clockTimerRef.current);
      clockTimerRef.current = null;
    }
    
    const shouldRunTimer = isConnected && 
                          !gameStatus.includes('Game Over') && 
                          isMyTurn;
    
    if (shouldRunTimer) {
      clockTimerRef.current = setInterval(() => {
        if (isWhiteTurn) {
          setWhiteTime(prev => {
            if (prev <= 1) {
              clearInterval(clockTimerRef.current);
              handleTimeOut('white');
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime(prev => {
            if (prev <= 1) {
              clearInterval(clockTimerRef.current);
              handleTimeOut('black');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    
    return () => {
      if (clockTimerRef.current) {
        clearInterval(clockTimerRef.current);
      }
    };
  }, [isWhiteTurn, isConnected, gameStatus, isMyTurn, gameType]);

  // Listen for WebSocket messages
  useEffect(() => {
    if (!stompClient || !isConnected) return;

    // Subscribe to move updates
    moveSubscriptionRef.current = stompClient.subscribe(`/topic/moves/${matchId}`, (message) => {
      try {
        const moveData = JSON.parse(message.body);
        
        // Check if this is OPPONENT'S move
        if (moveData.playerColor !== playerColor) {
          setOpponentMove(moveData);
          setIsMyTurn(true);
          setGameStatus("Your turn!");
          
          // Switch turn color based on opponent's move
          const opponentColor = moveData.playerColor;
          setIsWhiteTurn(opponentColor === 'black');
          
          // Update time from server if provided
          if (moveData.whiteTimeRemaining !== undefined) {
            setWhiteTime(moveData.whiteTimeRemaining);
          }
          if (moveData.blackTimeRemaining !== undefined) {
            setBlackTime(moveData.blackTimeRemaining);
          }
          
          // Add move to history
          if (moveData.move) {
            addMove(moveData.move);
          }
        }
      } catch (error) {
        console.error("Error parsing move data:", error);
      }
    });

    // Subscribe to game state updates
    stompClient.subscribe(`/topic/game-state/${matchId}`, (message) => {
      try {
        const state = JSON.parse(message.body);
        
        if (state.isWhiteTurn !== undefined) {
          setIsWhiteTurn(state.isWhiteTurn);
          const isMyTurnNow = (playerColor === 'white') ? state.isWhiteTurn : !state.isWhiteTurn;
          setIsMyTurn(isMyTurnNow);
        }
        
        if (state.status) {
          setGameStatus(state.status);
        }
        
        if (state.whiteTimeRemaining !== undefined) {
          setWhiteTime(state.whiteTimeRemaining);
        }
        if (state.blackTimeRemaining !== undefined) {
          setBlackTime(state.blackTimeRemaining);
        }
        
        if (state.result) {
          setGameStatus(`Game Over: ${state.result}`);
          if (clockTimerRef.current) {
            clearInterval(clockTimerRef.current);
          }
        }
      } catch (error) {
        console.error("Error parsing game state:", error);
      }
    });

    return () => {
      if (moveSubscriptionRef.current) {
        moveSubscriptionRef.current.unsubscribe();
      }
    };
  }, [stompClient, isConnected, matchId, playerColor]);

  // Handle timeout
  const handleTimeOut = (playerWhoLost) => {
    if (clockTimerRef.current) {
      clearInterval(clockTimerRef.current);
      clockTimerRef.current = null;
    }
    
    handleGameAction('timeout', { 
      player: playerWhoLost,
      whiteTimeRemaining: whiteTime,
      blackTimeRemaining: blackTime
    });
    
    alert(`${playerWhoLost === playerColor ? 'You' : 'Your opponent'} lost on time!`);
  };

  // Add move function
  const addMove = (move) => {
    if (move.piece !== move.piece.toLowerCase()) {
      // White's move
      const newMove = {
        move: move,
        moveToWhite: move.moveTo,
        fen: move.fen,
        tc: `White's Turn: ${move.tc || ''}`,
        tr: move.tr || ''
      };
      setMoves((moves) => [...moves, newMove]);
    } else {
      // Black's move - update last move
      setMoves((prevMoves) => {
        if (prevMoves.length === 0) return prevMoves;
        const newMoves = [...prevMoves];
        const lastMove = { 
          ...newMoves[newMoves.length - 1], 
          moveToBlack: move.moveTo,
          tc: `Black's Turn: ${move.tc || ''}`,
          tr: move.tr || '',
          fen: move.fen
        };
        newMoves[newMoves.length - 1] = lastMove;
        return newMoves;
      });
    }
  };

  // Function to send move to server
  const sendMove = (moveData) => {
    if (!stompClient || !isConnected) {
      alert("Not connected to server!");
      return false;
    }

    if (!isMyTurn) {
      alert("It's not your turn!");
      return false;
    }
    
    // Send move with current time
    stompClient.publish({
      destination: `/app/game/${matchId}/move`,
      body: JSON.stringify({
        ...moveData,
        playerColor: playerColor,
        timestamp: new Date().toISOString(),
        matchId: matchId,
        whiteTimeRemaining: whiteTime,
        blackTimeRemaining: blackTime,
        isWhiteTurn: (playerColor === 'white') ? false : true
      })
    });

    setIsMyTurn(false);
    setIsWhiteTurn(playerColor === 'white' ? false : true);
    setGameStatus("Waiting for opponent...");
    return true;
  };

  // Function to handle game actions
  const handleGameAction = (action, data = {}) => {
    if (!stompClient || !isConnected) {
      alert("Not connected to server!");
      return;
    }
    
    stompClient.publish({
      destination: `/app/game/${matchId}/${action}`,
      body: JSON.stringify({
        ...data,
        playerColor: playerColor,
        timestamp: new Date().toISOString(),
        matchId: matchId,
        whiteTimeRemaining: whiteTime,
        blackTimeRemaining: blackTime,
        isWhiteTurn: isWhiteTurn
      })
    });
  };

  return (
    <div className="game-container">
      {/* Game status bar */}
      <div className="game-status-bar">
        <div className="status-info">
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span className="player-info">Playing as: <strong>{playerColor}</strong></span>
          <span className="turn-info">{gameStatus}</span>
          <span className="turn-indicator">
            {isMyTurn ? '✓ Your turn' : '⏳ Opponent\'s turn'}
          </span>
        </div>
        
        <div className="game-actions">
          <button 
            className="btn-action btn-resign"
            onClick={() => {
              if (window.confirm("Are you sure you want to resign?")) {
                handleGameAction('resign');
              }
            }}
          >
            Resign
          </button>
          <button 
            className="btn-action btn-draw"
            onClick={() => handleGameAction('draw')}
          >
            Offer Draw
          </button>
        </div>
      </div>
      
      <BoardLayout 
        addMove={addMove}
        sendMove={sendMove}
        opponentMove={opponentMove}
        playerColor={playerColor}
        isMyTurn={isMyTurn}
        matchId={matchId}
        isConnected={isConnected}
        // Pass time data
        whiteTime={whiteTime}
        blackTime={blackTime}
        gameType={gameType}
        isWhiteTurn={isWhiteTurn}
      />
      <GamePlayControlContainer 
        moves={moves}
        matchId={matchId}
        stompClient={stompClient}
        isConnected={isConnected}
        playerColor={playerColor}
      />
    </div>
  );
};

export default GameContainer;