import React, { useState, useEffect, useRef } from "react";
import "../component-styles/Board.css";  // Importing CSS file
import PromotionModal from "../game-page-components/PromotionModal"

const Board = ({addMove}) => {
  const [boardSize, setBoardSize] = useState(500); // Initial size of the board
  const [board, setBoard] = useState([
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
  ]);  // Initial position of pieces
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [isSquareSelected, setIsSquareSelected] = useState(false);
  const [validMoves, setValidMoves] = useState([]);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [blackKingCoordinates, setBlackKingCoordinates] = useState([0,4]);
  const [whiteKingCoordinates, setWhiteKingCoordinates] = useState([7,4]);
  const boardRef = useRef(null);
  const [prevMove, setPrevMove] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [promotingPawn, setPromotingPawn] = useState(null); 
  // isKingInCheckHook[0] --> white king's check state
  // isKingInCheckHook[1] --> black king's check state
  const [isKingInCheckHook, setIsKingInCheckHook] = useState([false, false]); 

  // castling hooks
  // kingsMoved[0] --> signifies white's king movement
  // kingsMoved[1] --> signifies black's king movement
  const [kingsMoved, setKingsMoved] = useState([false,false]);

  // rooksMoved[0] --> signifies white's king side rook's movement
  // rooksMoved[1] --> signifies white's Queen side rook's movement
  // rooksMoved[2] --> signifies black's king side rook's movement
  // rooksMoved[3] --> signifies black's queen side rook's movement
  const [rooksMoved, setRooksMoved] = useState([false,false,false,false]);

  // Handle window resize
  const updateBoardSize = () => {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.6;  // 60% of the viewport size
    setBoardSize(size);
  };

  useEffect(() => {
    updateBoardSize();  // Set initial size
    window.addEventListener("resize", updateBoardSize);

    return () => {
      window.removeEventListener("resize", updateBoardSize);
    };
  }, []);

  const getPieceIcon = (piece) => {
    switch (piece) {
      case 'r': return '♜';
      case 'n': return '♞';
      case 'b': return '♝';
      case 'q': return '♛';
      case 'k': return '♚';
      case 'p': return '♟';
      case 'R': return '♖';
      case 'N': return '♘';
      case 'B': return '♗';
      case 'Q': return '♕';
      case 'K': return '♔';
      case 'P': return '♙';
      default: return '';
    }
  };

  function isUpperCase(str) {
    return str === str.toUpperCase();
  }

  const isSquareUnderAttack = (row, col) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece  && isWhiteTurn ? !isUpperCase(piece) : isUpperCase(piece) ) {
          const validMoves = getValidMoves(piece, r, c);
          if (validMoves.some(([r, c]) => r === row && c === col)) {
            setKingsMoved([kingsMoved[0], kingsMoved[1]]);
            return true;  
          }
        }
      }
    }
    return false;  // The square is not under attack
};


  const canCastleGeneral = () => {
    if ( (isWhiteTurn && isKingInCheckHook[0]) || (!isWhiteTurn && isKingInCheckHook[1])
       ||
      (isWhiteTurn && kingsMoved[0]) || (!isWhiteTurn && kingsMoved[1]) ) return false;  
    return true;
  };

  const canCastleLong = () => {
        let ind = -1;
        if(isWhiteTurn) ind = 1;
        else if(!isWhiteTurn) ind = 3;

        if (isWhiteTurn) {
          if ( rooksMoved[ind] ) return false; 
        } else {
          if ( rooksMoved[ind] ) return false; 
        }
        return true;
  }

  const canCastleShort = () => {
        let ind = -1;
        if(isWhiteTurn) ind = 0;
        else if(!isWhiteTurn) ind = 2;

        if (isWhiteTurn) {
          if ( rooksMoved[ind] ) return false; 
        } else {
          if ( rooksMoved[ind] ) return false; 
        }
        return true;
  }


  const getValidMoves = (piece, row, col) => {
  const moves = [];
  // if king is in check only king moves or capture is available
  switch (piece.toLowerCase()) {
    case "p":
      // Pawn movement: moves one square forward (two squares on first move)
      const direction = piece === "p" ? 1 : -1;  // Black pawn moves down, white moves up
      if (board[row + direction]) {
        if(board[row+direction][col] == "")
        moves.push([row + direction, col]);
        if(col-1>=0){
          if(piece === "p" && board[row+direction][col-1]!= "" && isUpperCase(board[row+direction][col-1])){
            moves.push([row + direction, col-1]);
          }
          else if(piece === "P" && board[row+direction][col-1]!= "" && !isUpperCase(board[row+direction][col-1])){
            moves.push([row + direction, col-1]);
          }
        }
        if(col+1<8){
          if(piece === "p" && board[row+direction][col+1]!= "" && isUpperCase(board[row+direction][col+1])){
            moves.push([row + direction, col+1]);
          }
          else if(piece === "P" && board[row+direction][col+1]!= "" && !isUpperCase(board[row+direction][col+1])){
            moves.push([row + direction, col+1]);
          }
        }
      }
        if((row == 1 && piece === "p" &&  board[row+2*direction][col] == "" && board[row+direction][col] == "")
        || (row == 6 && piece === "P" &&  board[row+2*direction][col] == "" && board[row+direction][col] == ""))
        moves.push([row + 2*direction, col]);
        
        if((row === 3 && piece === "P" && prevMove.piece === "p" && 
          Math.abs(prevMove.sqnumfrom-prevMove.sqnumto) === 2 && Math.abs(col-prevMove.tc)===1)
        ||
          (row === 4 && piece === "p" && prevMove.piece === "P" && 
          Math.abs(prevMove.sqnumfrom-prevMove.sqnumto) === 2 && Math.abs(col-prevMove.tc)===1)
        )
        moves.push([row + direction, prevMove.tc]);

      break;

    case "r":
      // Rook movement: horizontal and vertical
      // all sorted
      let forwardMotion = true, backwardMotion = true, leftMotion = true, rightMotion = true;
      for (let i = 1; i < 8; i++) {
        if (forwardMotion && row + i < 8 && board[row + i][col]== "") moves.push([row + i, col]);
        else if(forwardMotion && row + i < 8 && board[row + i][col]!= ""){
          // check if it is attacking a piece
          let rook = board[row][col];
          let attackPoint = board[row+i][col];
          // ch lowercase, b[row+i][col] uppercase
          // ch uppercase, b[row+i][col] lowercase
          if( (isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
                moves.push([row + i, col]);
          forwardMotion = false;
        }
        if (backwardMotion && row - i >= 0 && board[row - i][col]=="") moves.push([row - i, col]);
        else if(backwardMotion && row - i >= 0 && board[row - i][col]!=""){
          // check if it is attacking a piece
          let rook = board[row][col];
          let attackPoint = board[row-i][col];
          // ch lowercase, b[row-i][col] uppercase
          // ch uppercase, b[row-i][col] lowercase
          if( (isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
                moves.push([row - i, col]);
          backwardMotion = false;
        }
        if (rightMotion && col + i < 8 && !board[row][col + i]) moves.push([row, col + i]);
        else if(rightMotion && col + i < 8 && board[row][col+i]!=""){
          // check if it is attacking a piece
          let rook = board[row][col];
          let attackPoint = board[row][col+i];
          // ch lowercase, b[row-i][col] uppercase
          // ch uppercase, b[row-i][col] lowercase
          if( (isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
                moves.push([row, col+i]);
          rightMotion = false;
        }
        if (leftMotion && col - i >= 0 && !board[row][col - i]) moves.push([row, col - i]);
        else if(leftMotion && col - i >= 0 && board[row][col-i]!=""){
          // check if it is attacking a piece
          let rook = board[row][col];
          let attackPoint = board[row][col-i];
          // ch lowercase, b[row-i][col] uppercase
          // ch uppercase, b[row-i][col] lowercase
          if( (isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
                moves.push([row, col-i]);
          leftMotion = false;
        }
        if(!forwardMotion && !backwardMotion && !leftMotion && !rightMotion) break;
      }
      break;

    case "n":
      // sorted
      // Knight movement: L-shape (two squares in one direction, then one square perpendicular)
      const knightMoves = [
        [-2, -1], [-2, 1], [2, -1], [2, 1],
        [-1, -2], [1, -2], [-1, 2], [1, 2]
      ];
      knightMoves.forEach(([r, c]) => {
        if (row + r >= 0 && row + r < 8 && col + c >= 0 && col + c < 8) {
          // attack points
          let knight = board[row][col];
          let attackPoint = board[row+r][col+c];
          if(attackPoint == "" || 
            (isUpperCase(knight) && !isUpperCase(attackPoint)) ||
            (!isUpperCase(knight) && isUpperCase(attackPoint)))
          moves.push([row + r, col + c]);
        }
      });
      break;

    case "k":
      // King movement: one square in any direction
      const kingMoves = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ];
      kingMoves.forEach(([r, c]) => {
        if (row + r >= 0 && row + r < 8 && col + c >= 0 && col + c < 8) {
          let king = board[row][col];
          let attackPoint = board[row+r][col+c];
          // king cannot move inside check
          if(attackPoint == "" || 
            (isUpperCase(king) && !isUpperCase(attackPoint)) ||
            (!isUpperCase(king) && isUpperCase(attackPoint)))
          moves.push([row + r, col + c]);
        }
      });
      // castling logic incomplete with isSquareUnderAttack
      if (canCastleGeneral()) {
        //check short side castle
          // squares must be empty and squares must not be in attack
        if(canCastleShort() && board[row][5] === "" && board[row][6] === "" 
          // !isSquareUnderAttack(row, 5) && !isSquareUnderAttack(row, 6)
        )
          moves.push([row, 6]);
        // check long side castle
        if(canCastleLong() && board[row][3] === "" && board[row][2] === "" && board[row][1] === "" 
          // !isSquareUnderAttack(row, 3) && !isSquareUnderAttack(row, 2)
          ){
          moves.push([row, 2]);
        }
      }
      break;

    case "b":
      // sorted
      // Bishop movement: diagonal in any direction
      let tleftdiag = true, trightdiag = true, 
      bleftdiag = true, brightdiag = true;

      for (let i = 1; i < 8; i++) {
        // Top-left diagonal
        if (tleftdiag && row - i >= 0 && col - i >= 0 && !board[row - i][col - i]) moves.push([row - i, col - i]);
        else if(tleftdiag && row - i >= 0 && col - i >= 0 && board[row - i][col - i]!=""){
          let bishop = board[row][col];
          let attackPoint = board[row-i][col-i];
          // ch lowercase, b[row+i][col] uppercase
          // ch uppercase, b[row+i][col] lowercase
          if( (isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
                moves.push([row - i, col - i]);
          tleftdiag = false;
        }
        // Top-right diagonal
        if (trightdiag && row - i >= 0 && col + i < 8 && !board[row - i][col + i]) moves.push([row - i, col + i]);
        else if(trightdiag && row - i >= 0 && col + i < 8 && board[row - i][col + i]!=""){
          let bishop = board[row][col];
          let attackPoint = board[row-i][col+i];
          // ch lowercase, b[row+i][col] uppercase
          // ch uppercase, b[row+i][col] lowercase
          if( (isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
                moves.push([row - i, col + i]);
          trightdiag = false;
        }
        // Bottom-left diagonal
        if (bleftdiag && row + i < 8 && col - i >= 0 && !board[row + i][col - i]) moves.push([row + i, col - i]);
        else if(bleftdiag && row + i < 8 && col - i >= 0 && board[row + i][col - i]!=""){
          let bishop = board[row][col];
          let attackPoint = board[row+i][col-i];
          // ch lowercase, b[row+i][col] uppercase
          // ch uppercase, b[row+i][col] lowercase
          if( (isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
                moves.push([row + i, col - i]);
          bleftdiag = false;
        }
        // Bottom-right diagonal
        if (brightdiag && row + i < 8 && col + i < 8 && !board[row + i][col + i]) moves.push([row + i, col + i]);
        else if(brightdiag && row + i < 8 && col + i < 8 && board[row + i][col + i]!=""){
          let bishop = board[row][col];
          let attackPoint = board[row+i][col+i];
          // ch lowercase, b[row+i][col] uppercase
          // ch uppercase, b[row+i][col] lowercase
          if( (isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
                moves.push([row + i, col + i]);
          brightdiag = false;
        }
      }
      break;

    case "q":
      // sorted
      // Queen movement: combines rook and bishop movement
      // Rook-like moves (vertical and horizontal)
      let qforwardMotion = true, qbackwardMotion = true, qleftMotion = true, qrightMotion = true;
      for (let i = 1; i < 8; i++) {
        if (qforwardMotion && row + i < 8 && board[row + i][col]== "") moves.push([row + i, col]);
        else if(qforwardMotion && row + i < 8 && board[row + i][col]!= ""){
          // check if it is attacking a piece
          let rook = board[row][col];
          let attackPoint = board[row+i][col];
          // ch lowercase, b[row+i][col] uppercase
          // ch uppercase, b[row+i][col] lowercase
          if( (isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
                moves.push([row + i, col]);
          qforwardMotion = false;
        }
        if (qbackwardMotion && row - i >= 0 && board[row - i][col]=="") moves.push([row - i, col]);
        else if(qbackwardMotion && row - i >= 0 && board[row - i][col]!=""){
          // check if it is attacking a piece
          let rook = board[row][col];
          let attackPoint = board[row-i][col];
          // ch lowercase, b[row-i][col] uppercase
          // ch uppercase, b[row-i][col] lowercase
          if( (isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
                moves.push([row - i, col]);
          qbackwardMotion = false;
        }
        if (qrightMotion && col + i < 8 && !board[row][col + i]) moves.push([row, col + i]);
        else if(qrightMotion && col + i < 8 && board[row][col+i]!=""){
          // check if it is attacking a piece
          let rook = board[row][col];
          let attackPoint = board[row][col+i];
          // ch lowercase, b[row-i][col] uppercase
          // ch uppercase, b[row-i][col] lowercase
          if( (isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
                moves.push([row, col+i]);
          qrightMotion = false;
        }
        if (qleftMotion && col - i >= 0 && !board[row][col - i]) moves.push([row, col - i]);
        else if(qleftMotion && col - i >= 0 && board[row][col-i]!=""){
          // check if it is attacking a piece
          let rook = board[row][col];
          let attackPoint = board[row][col-i];
          // ch lowercase, b[row-i][col] uppercase
          // ch uppercase, b[row-i][col] lowercase
          if( (isUpperCase(rook) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(rook) && isUpperCase(attackPoint)))
                moves.push([row, col-i]);
          qleftMotion = false;
        }
        if(!qforwardMotion && !qbackwardMotion && !qleftMotion && !qrightMotion) break;
      }
      // Bishop-like moves (diagonal)
      let qtleftdiag = true, qtrightdiag = true, 
      qbleftdiag = true, qbrightdiag = true;

      for (let i = 1; i < 8; i++) {
        // Top-left diagonal
        if (qtleftdiag && row - i >= 0 && col - i >= 0 && !board[row - i][col - i]) moves.push([row - i, col - i]);
        else if(qtleftdiag && row - i >= 0 && col - i >= 0 && board[row - i][col - i]!=""){
          let bishop = board[row][col];
          let attackPoint = board[row-i][col-i];
          // ch lowercase, b[row+i][col] uppercase
          // ch uppercase, b[row+i][col] lowercase
          if( (isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
                moves.push([row - i, col - i]);
          qtleftdiag = false;
        }
        // Top-right diagonal
        if (qtrightdiag && row - i >= 0 && col + i < 8 && !board[row - i][col + i]) moves.push([row - i, col + i]);
        else if(qtrightdiag && row - i >= 0 && col + i < 8 && board[row - i][col + i]!=""){
          let bishop = board[row][col];
          let attackPoint = board[row-i][col+i];
          // ch lowercase, b[row+i][col] uppercase
          // ch uppercase, b[row+i][col] lowercase
          if( (isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
                moves.push([row - i, col + i]);
          qtrightdiag = false;
        }
        // Bottom-left diagonal
        if (qbleftdiag && row + i < 8 && col - i >= 0 && !board[row + i][col - i]) moves.push([row + i, col - i]);
        else if(qbleftdiag && row + i < 8 && col - i >= 0 && board[row + i][col - i]!=""){
          let bishop = board[row][col];
          let attackPoint = board[row+i][col-i];
          // ch lowercase, b[row+i][col] uppercase
          // ch uppercase, b[row+i][col] lowercase
          if( (isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
                moves.push([row + i, col - i]);
          qbleftdiag = false;
        }
        // Bottom-right diagonal
        if (qbrightdiag && row + i < 8 && col + i < 8 && !board[row + i][col + i]) moves.push([row + i, col + i]);
        else if(qbrightdiag && row + i < 8 && col + i < 8 && board[row + i][col + i]!=""){
          let bishop = board[row][col];
          let attackPoint = board[row+i][col+i];
          // ch lowercase, b[row+i][col] uppercase
          // ch uppercase, b[row+i][col] lowercase
          if( (isUpperCase(bishop) && !isUpperCase(attackPoint)) ||
              (!isUpperCase(bishop) && isUpperCase(attackPoint)))
                moves.push([row + i, col + i]);
          qbrightdiag = false;
        }
      }
      break;

    default:
      break;
  }

  return moves;
};


  const handleSquareClick = (row, col) => {
    const piece = board[row][col];
    if(isSquareSelected && selectedSquare[0] === row && selectedSquare[1] === col){
      setSelectedSquare([]);
      setIsSquareSelected(false);
      setValidMoves([]);
      return;
    }
    if (!piece || (isWhiteTurn && !isUpperCase(piece)) || (!isWhiteTurn && isUpperCase(piece))) return;
    setIsSquareSelected(true);
    setSelectedSquare([row, col]);
    setValidMoves(getValidMoves(piece, row, col));
  };

  const handleDragStart = (e, row, col) => {
    const piece = board[row][col];
    if (!piece || (isWhiteTurn && !isUpperCase(piece)) || (!isWhiteTurn && isUpperCase(piece))) return;
    setIsSquareSelected(true);
    setSelectedSquare([row, col]);
    setValidMoves(getValidMoves(piece, row, col));
    e.dataTransfer.setData("piece", piece);
    e.dataTransfer.setData("fromRow", row);
    e.dataTransfer.setData("fromCol", col);
  };

  const isKingInCheck = () => {
    for(let i = 0; i<8; i++){
      for(let j = 0; j<8; j++){
        const piece = board[i][j];
        if( (isWhiteTurn && isUpperCase(piece)) || (!isWhiteTurn && !isUpperCase(piece))){
          const kingRow = isWhiteTurn ? blackKingCoordinates[0] : whiteKingCoordinates[0];
          const kingCol = isWhiteTurn ? blackKingCoordinates[1] : whiteKingCoordinates[1];
          const moves = getValidMoves(piece, i, j);
          if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
            if(isWhiteTurn) setIsKingInCheckHook([false, true]);
            else setIsKingInCheckHook([true, false]);
            return true;
          }
        }
      }
    }
    return false;
  }


  // piece(non-pawn) + capture(x) + squareTo + check(+)/checkmate(#)

  
  // for castling --> O-O, O-O-O
  // for checkmate --> qg7#
  const updatePrevMove = (fr, fc, tr, tc, piece, capturedPiece) => {
    const sqnumfrom = 8-fr;
    const sqnumto = 8-tr;
    let moveFrom = String.fromCharCode('a'.charCodeAt(0) + fc);
    let moveTo = String.fromCharCode('a'.charCodeAt(0) + tc);
    if(capturedPiece === ""){
      moveFrom += sqnumfrom;
      moveTo = "" + (piece.toLowerCase() === "p" ? "" : piece) + moveTo + sqnumto;
    }
    else{
      moveTo = (piece.toLowerCase() === "p" ? moveFrom : piece) + "x" + moveTo + sqnumto;
      moveFrom += sqnumfrom;
    }

    if(isKingInCheck()) moveTo += "+";
    // console.log({piece, moveFrom, moveTo});
    setPrevMove({piece, moveFrom, moveTo, sqnumfrom, sqnumto, tc , tr});
    addMove({piece, moveFrom, moveTo, sqnumfrom, sqnumto, tc , tr});
  }


  const handlePromotion = (promotionPiece) => {
    const [row, col, piece] = promotingPawn;

    if(row === 7) promotionPiece = promotionPiece.toLowerCase();

    const newBoard = [...board];
    newBoard[row][col] = promotionPiece;  // Promote the pawn to the selected piece

    setBoard(newBoard);
    setShowModal(false);  // Close the promotion modal
  };

  const handleDrop = (e, row, col) => {
    let piece = e.dataTransfer.getData("piece");
    const fromRow = parseInt(e.dataTransfer.getData("fromRow"));
    const fromCol = parseInt(e.dataTransfer.getData("fromCol"));
    const newBoard = [...board];
    let capturedPiece = newBoard[row][col];
    if (validMoves.some(([r, c]) => r === row && c === col)) {
      // enpassant capture
      if(piece.toLowerCase() === "p" && capturedPiece === "" && Math.abs(col - fromCol) === 1){
        if(piece === "p") {
          capturedPiece = newBoard[row-1][col];
          newBoard[row-1][col] = "";
        }
        else {
          capturedPiece = newBoard[row+1][col];
          newBoard[row+1][col] = "";
        }
      }

      // promotion
      // promotion logic
        if (piece === "p" && row === 7) {
          setPromotingPawn([row, col, piece]);  // Save the pawn's position and type
          setShowModal(true);  // Show the modal for promotion
        } else if (piece === "P" && row === 0) {
          setPromotingPawn([row, col, piece]);  // Save the pawn's position and type
          setShowModal(true);  // Show the modal for promotion
        }

      newBoard[row][col] = piece;
      newBoard[fromRow][fromCol] = "";
      setBoard(newBoard);
      updatePrevMove(fromRow, fromCol, row, col, piece, capturedPiece);
      setIsWhiteTurn(!isWhiteTurn)
    }
    setIsSquareSelected(false);
    setSelectedSquare([]);
    setValidMoves([]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="chessboard-container">
      <div
        ref={boardRef}
        className="chessboard"
        style={{ width: boardSize, height: boardSize }}
      >
        {/* Render the board */}
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((piece, colIndex) => (
              <div
                key={colIndex}
                className={`square ${((rowIndex + colIndex) % 2 === 0) ? 'light' : 'dark'}`}
                style={{ width: `${100 / 8}%` }}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                onDragStart={(e) => handleDragStart(e, rowIndex, colIndex)}
                onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                onDragOver={handleDragOver}
                draggable={piece !== ""}  
              >
                {getPieceIcon(piece)}
                {validMoves.some(([r, c]) => r === rowIndex && c === colIndex) && (
                  <div className="valid-move-overlay"></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <PromotionModal
        showModal={showModal}
        onClose={() => setShowModal(false)}  // Close the modal when clicked outside
        onSelect={handlePromotion}  // Handle promotion piece selection
      />
    </div>
  );
};

export default Board;
