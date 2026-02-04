import React, { useState, useEffect } from 'react';
import "../component-styles/Clock.css";



const Clock = ({ time, gameType, isActive, playerColor }) => {
  const formatTime = (seconds) => {
    if (gameType === 'classical') return '∞';
    if (seconds <= 0) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`clock clock-${playerColor} ${isActive ? 'active' : ''}`}>
      <div className="time-display">{formatTime(time)}</div>
    </div>
  );
};

export default Clock;