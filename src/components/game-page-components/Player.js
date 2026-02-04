import React from "react";
import { FaFlag } from "react-icons/fa";  // Use react-icons for flag icon (if needed)
import "../component-styles/Player.css";
import Clock from "./Clock";


const Player = ({ 
  playerColor, 
  time, 
  gameType, 
  isActive, 
  playerName,
  isCurrentPlayer 
}) => {
  return (
    <div className={`player player-${playerColor} ${isActive ? 'active' : ''} ${isCurrentPlayer ? 'current-player' : ''}`}>
      <div className="player-info">
        <div className="player-name">
          {playerName} ({playerColor})
          {isCurrentPlayer && <span className="you-indicator"> (You)</span>}
        </div>
      </div>
      
      {/* Clock component */}
      <Clock 
        time={time}
        gameType={gameType}
        isActive={isActive}
        playerColor={playerColor}
      />
    </div>
  );
};

export default Player;
