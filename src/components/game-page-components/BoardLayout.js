import React from "react";
import Player from "./Player";
import Board from "./Board";
import "../component-styles/BoardLayout.css";

const BoardLayout = ({ 
  addMove, 
  sendMove, 
  opponentMove, // New prop
  playerColor, 
  isMyTurn, 
  whiteTime,
  blackTime,
  matchId,
  isConnected ,
  gameType,
  isWhiteTurn
}) => {

  const isCurrentPlayerWhite = (playerColor === 'white');

  return (
    <div className="board-layout-main">
      <Player 
        playerColor="black"
        time={blackTime}
        gameType={gameType}
        isActive={!isWhiteTurn}
        isOpponent={true}
        matchId={matchId}
        isCurrentPlayer={!isCurrentPlayerWhite}
      />
      <Board 
        addMove={addMove}
        sendMove={sendMove}
        opponentMove={opponentMove} // Pass to Board
        playerColor={playerColor}
        isMyTurn={isMyTurn}
        isConnected={isConnected}
        
      />
      <Player 
        playerColor="white"
        time={whiteTime}
        gameType={gameType}
        isActive={isWhiteTurn}
        isOpponent={false}
        matchId={matchId}
        isCurrentPlayer={isCurrentPlayerWhite}
      />
    </div>
  );
};

export default BoardLayout;