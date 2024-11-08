import type { ClassicGameInfo } from "@/types/game.js";
import { defaultSetup } from "@/chess/chess.js";

export default class ClassicGame {
  game: ClassicGameInfo;
  constructor(setup: ClassicGameInfo | undefined) {
    if (setup) {
      this.game = setup;
    } else {
      this.game = defaultSetup;
    }
  }
  // move(piece: number, move: number) {
  //   if (!this.game.board[piece]) {
  //     throw new Error("There is no piece to move here: " + piece);
  //   }
  //   if (!this.game.board[piece].moves[move]) {
  //     throw new Error("This is not a possible move");
  //   }
  //   this.game = updateGame(piece, move, this.game);
  // }
}

function updateGame(
  piece: number,
  move: number,
  game: ClassicGameInfo
): ClassicGameInfo {
  return game;
}
