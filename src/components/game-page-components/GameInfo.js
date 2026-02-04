import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFire, FaRegHandshake, FaRobot, FaChessPawn, FaTimes, FaClock } from "react-icons/fa";
import "../component-styles/GameInfo.css";

const GameInfo = ({ streak }) => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [gameType, setGameType] = useState("classical");
  const pollingIntervalRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const cancelSearch = async () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    
    try {
      await fetch('http://localhost:8080/api/v1/match/cancel-waiting', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameType: gameType })
      });
    } catch (error) {
      console.error("Error cancelling search:", error);
    }
    
    setIsSearching(false);
    setSearchTime(0);
  };

  const pollForMatch = (type) => {
    let attempts = 0;
    const maxAttempts = type === "rapid" ? 60 : 90;
    
    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      setSearchTime(attempts);
      
      if (attempts >= maxAttempts) {
        cancelSearch();
        alert(`Could not find an opponent within ${maxAttempts} seconds. Please try again.`);
        return;
      }
      
      try {
        const response = await fetch('http://localhost:8080/api/v1/match/check-match', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.matchId && result.matchId > 0) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            clearTimeout(searchTimerRef.current);
            searchTimerRef.current = null;
            
            setIsSearching(false);
            setSearchTime(0);
            navigate(`/game/${result.matchId}`, { 
              state: { 
                gameType: type,
                timeControl: type === "rapid" ? "10 min" : "unlimited"
              } 
            });
          } else if (result.matchId === -2) {
            cancelSearch();
            alert("Error checking for match. Please try again.");
          }
        }
      } catch (error) {
        console.error("Error polling for match:", error);
      }
    }, 1000);
  };

  const createNewGame = async (type = "classical") => {
    console.log(`Creating ${type} game...`);
    
    if (isSearching) {
      cancelSearch();
      return;
    }

    setIsSearching(true);
    setSearchTime(0);
    setGameType(type);
    
    try {
      console.log('Sending request with credentials: include');
      
      // Option 1: Try with general endpoint and JSON body
      // endpoint not found
      const response = await fetch('http://localhost:8080/api/v1/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This should send cookies automatically
        body: JSON.stringify({ gameType: type })
      });

      console.log('Response status:', response.status);
      console.log('Response redirected:', response.redirected);
      console.log('Response URL:', response.url);
      
      // Check response headers
      console.log('Response headers:');
      for (const [key, value] of response.headers.entries()) {
        console.log(`${key}: ${value}`);
      }
      
      if (response.ok && !response.redirected) {
        const result = await response.json();
        console.log('Response data:', result);
        
        if (result.matchId === -1) {
          pollForMatch(type);
          
          const timeout = type === "rapid" ? 60000 : 90000;
          searchTimerRef.current = setTimeout(() => {
            if (isSearching) {
              cancelSearch();
              alert(`Could not find an opponent within ${timeout/1000} seconds. Please try again.`);
            }
          }, timeout);
          
        } else if (result.matchId > 0) {
          clearTimeout(searchTimerRef.current);
          searchTimerRef.current = null;
          setIsSearching(false);
          navigate(`/game/${result.matchId}`, { 
            state: { 
              gameType: type,
              timeControl: type === "rapid" ? "10 min" : "unlimited"
            } 
          });
        } else if (result.matchId === -2) {
          setIsSearching(false);
          alert("Failed to create match. Please try again.");
        }
      } else {
        console.log('Response not OK or redirected');
        
        // Try to read the response text for more info
        try {
          const responseText = await response.text();
          console.log('Response text:', responseText);
          
          if (responseText) {
            try {
              const errorJson = JSON.parse(responseText);
              console.log('Response JSON:', errorJson);
            } catch (e) {
              console.log('Response is not JSON');
            }
          }
        } catch (e) {
          console.log('Could not read response text');
        }
        
        setIsSearching(false);
        
        if (response.redirected) {
          alert("Authentication issue. Please try logging in again.");
          navigate('/login');
        } else if (response.status === 0) {
          // Status 0 usually means network error or CORS error
          alert("Network error. Please check:\n1. Backend server is running\n2. CORS is properly configured\n3. No browser extensions blocking requests");
        } else {
          alert(`Failed to create game. Status: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Network error details:', error);
      setIsSearching(false);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        alert("Cannot connect to server. Please check:\n1. Backend is running on http://localhost:8080\n2. No firewall blocking the connection\n3. Try refreshing the page");
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Test function to check connectivity
  const testConnection = async () => {
    console.log('Testing connection to backend...');
    try {
      const response = await fetch('http://localhost:8080/api/v1/match/check-match', {
        method: 'GET',
        credentials: 'include',
      });
      console.log('Connection test status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  };

  // Run connection test on component mount
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="game-info">
      <div className="streak">
        <FaFire size={30} />
        <div>
          <p>Streak</p>
          <h3>{streak} Days</h3>
        </div>
      </div>

      <div className="game-type-selector">
        <div className="game-type-header">
          <h3>Select Game Type</h3>
          <div className="game-type-status">
            {isSearching && (
              <span className="searching-for">Searching for {gameType} game...</span>
            )}
          </div>
        </div>
        <div className="game-type-buttons">
          <button 
            className={`game-type-btn ${gameType === 'classical' ? 'active' : ''}`}
            onClick={() => !isSearching && setGameType('classical')}
            disabled={isSearching}
          >
            <FaChessPawn size={20} />
            <div className="game-type-info">
              <span className="game-type-name">Classical</span>
              <span className="game-type-time">No time limit</span>
            </div>
          </button>
          
          <button 
            className={`game-type-btn ${gameType === 'rapid' ? 'active' : ''}`}
            onClick={() => !isSearching && setGameType('rapid')}
            disabled={isSearching}
          >
            <FaClock size={20} />
            <div className="game-type-info">
              <span className="game-type-name">Rapid</span>
              <span className="game-type-time">10 min each</span>
            </div>
          </button>
        </div>
      </div>

      <div className="play-button-container">
        <button 
          className={`play-button ${isSearching ? 'searching' : ''} ${gameType}`} 
          onClick={() => createNewGame(gameType)}
          disabled={isSearching && gameType === null}
        >
          {isSearching ? (
            <>
              <FaTimes size={20} />
              Cancel Search ({formatTime(searchTime)})
            </>
          ) : (
            <>
              {gameType === 'rapid' ? <FaClock size={20} /> : <FaChessPawn size={20} />}
              Play {gameType === 'rapid' ? 'Rapid (10 min)' : 'Classical'}
            </>
          )}
        </button>
      </div>

      <div className="quick-play-buttons">
        <button className="quick-button" disabled={isSearching}>
          <FaChessPawn size={16} />
          <div className="quick-button-info">
            <span>Bullet</span>
            <span>1 min</span>
          </div>
        </button>
        <button className="quick-button" disabled={isSearching}>
          <FaRobot size={16} />
          <div className="quick-button-info">
            <span>vs Bot</span>
            <span>Any level</span>
          </div>
        </button>
        <button className="quick-button" disabled={isSearching}>
          <FaRegHandshake size={16} />
          <div className="quick-button-info">
            <span>Friend</span>
            <span>Invite</span>
          </div>
        </button>
      </div>
      
      {isSearching && (
        <div className="searching-indicator">
          <div className="spinner"></div>
          <p>Searching for {gameType} game opponent... {formatTime(searchTime)}</p>
          <p className="searching-hint">
            {gameType === 'rapid' 
              ? 'Looking for players for 10-minute rapid game' 
              : 'Looking for players for classical game (no time limit)'}
          </p>
          <button className="cancel-search-button" onClick={cancelSearch}>
            <FaTimes /> Cancel Search
          </button>
        </div>
      )}
    </div>
  );
};

export default GameInfo;