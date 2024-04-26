---
date: 2024-04-17 23:20
description: Adding a bestMove method to swift-chess-neo by implementing alpha-beta pruning for minimax 
tags: Swift, Chess, Game Theory, Mathematics, Tutorial
---

# Implementing Minimax with Alpha-Beta pruning for a simple Chess AI in Swift

Ever since Chess24 shut down, I have been looking to find a better way to follow Chess tournaments. A few weeks ago I decided to start working on a cross-platform (macOS/iOS) app using Lichess's API.
I heavily underestimated the amount of work it would take me to build something like this in SwiftUI. You not only need a library that can parse PGNs, but also a way to display those moves! 


I ended up forking [Sage](https://github.com/nvzqz/Sage) to [swift-chess-neo](https://git.navan.dev/swift-chess-neo). I did have to patch the library to make it compatible with Swift 5 and create my own UI components using SwiftUI.


Now that I had a working Chess library that could give me all legal moves in a position, I wondered if I could write a minimax implementation.

## Theory

Imagine you could look far ahead into the future and predict the perfect moves in a game for both sides. This is similar to Dr. Strange seeing all 14,000,605 alternate futures.
Knowing what works and what doesn't can help you decide what you should actually play.


Using the example of Dr. Strange looking into the alternate futures, think of the Avengers winning being scored as +1, and Thanos winning being scored as -1.
The Avengers would try to maximize this score, whereas Thanos would try to minimize this. 


This is the idea of "minimax".


Say we are playing a game of Tic-Tac-Toe, where us winning is scored positively and our opponent winning is scored negatively. We are going to try and maximize our score. A fresh game of Tic-Tac-Toe can be represented as a 3x3 grid. Which means, if we have the first turn we have 9 possible moves.

Say we place an X in the top left corner:

```
-------------
| x |   |   |
-------------
|   |   |   |
-------------
|   |   |   |
-------------
```

Now, our oponent has 8 different moves they can play. Say they play their move in the bottom right corner

```
-------------
| x |   |   |
-------------
|   |   |   |
-------------
|   |   | o |
-------------
```

We have 6 different moves we can play.

It would take us ages to brute force each and every combination/permutation of moves by hand. A depth-first minimax algorithm for Tick-Tac-Toe would have a max-depth of 9 (since after 9 moves from the start, we would have exhausted the search space as there would be no more available moves).

Since we cannot score an individual Tic-Tac-Toe position (technically we can), we can iterate through all moves (till we reach our max-depth) and then use these three terminal states:

* +1 (You Win)
* -1 (You Lose)
* 0 (Draw)

### Pseudocode

```
function minimax(board, depth, isMaximizingPlayer):
    score = evaluate(board)

    # +1 Win, -1 Lose, 0 Draw
    if score == 1: return score
    if score == -1: return score

    if boardFull(board):
        return 0

    if isMaximizingPlayer:
        best = -infinity

        for each cell in board:
            if cell is empty:
                place X in cell
                best = maximum of (best, minimax(board, depth + 1, false))
                remove X from cell
        return best

    else:
        best = infinity

        for each cell in board:
            if cell is empyu:
                place O in cell
                best = minimum of (best, minimax(board, depth + 1, true))
        return best

function evaluate(board):
    if three consecutive Xs: return 1
    if three consecutive 0s: return -1

    return 0

function boardFull(board):
    if all cells are filled: return true
    
    else:
        return false
```

Think of each move as a node, and each node having multiple continuations (each continuing move can be represented as a node).

### Alpha-Beta Pruning

This is quiet inefficient, as this will comb through all $9!$ or $362,880$ moves! Imagine iterating through the entire search space for a complex game like Chess. It would be impossible. Therefore we use a technique called Alpha-beta pruning wherein we reduce the number of nodes that we are evaluating. 

```
function minimax(board, depth, isMaximizingPlayer, alpha, beta):
    score = evaluate(board)

    # +1 Win, -1 Lose, 0 Draw
    if score == 1: return score
    if score == -1: return score

    if boardFull(board):
        return 0

    if isMaximizingPlayer:
        best = -infinity

        for each cell in board:
            if cell is empty:
                place X in cell
                best = maximum of (best, minimax(board, depth + 1, false, alpha, beta))
                remove X from cell
                alpha = max(alpha, best)
                if beta <= alpha:
                    break
        return best

    else:
        best = infinity

        for each cell in board:
            if cell is empyu:
                place O in cell
                best = minimum of (best, minimax(board, depth + 1, true, alpha, beta))
                beta = min(beta, best)
                if beta <= alpha:
                    break
        return best
```

Alpha and beta are initialized as $-\infty$ and $+\infty$ respectively, with Alpha representing the best already explored option along the path to the root for the maximizer, and beta representing the best already explored option along the path to the root for the minimizer. If at any point beta is less than or equal to alpha, it means that the current branch does not need to be explored further because the parent node already has a better move elsewhere, thus "pruning" this node.

Thus, to implement a model you can use minimax (or similar algorithms), you need to be able to describe the following:

* Players
    * Player Count - How many players are there in this game? (Just 2)
    * Active Player - Whose turn is it?
* Game
    * Game State - How do you represent the current game state
    * Save/Load Game State - If you are trying out different moves, you need to be able to go to the original state before you move on to the next node
    * Score - Who is winning? Is the game over? Who lost?
* Moves
    * Valid Moves - What are all the legal moves in this game state? 

## Show me the code!

The chess library does a little bit of the heavy lifting by already providing methods to take care of the above requirements. Since we already have a way to find all possible moves in a position, we only need to figure out a few more functions/methods:

* Evaluation/Score - We need to be able to numerically quantify the effect of a move. For a basic implementation we can just sum over the piece values.
* Game state management - Since we explore different possible moves in our search space up to a certain depth, we need to be able to copy/save the state and reset it back to this state after we are done exploring all of our moves. Even though I did add a `setGame` method to the `Game` class, I use the `undoMove()` method

### Evaluate

Each piece has a different relative value. Since "capturing" the king finishes the game, the king is given a really high value.

```swift
public struct Piece: Hashable, CustomStringConvertible {
    public enum Kind: Int {
        ...
        public var relativeValue: Double {
            switch self {
                case .pawn: return 1
                case .knight: return 3
                case .bishop: return 3.25
                case .rook: return 5
                case .queen: return 9
                case .king: return 900
            }
        }
        ...
    }
    ...
}
```

We extend the `Game` class by adding an evaluate function that adds up the value of all the pieces left on the board.

```swift
extension Game {
    func evaluate() -> Double {
        var score: Double = 0
        for square in Square.all {
            if let piece = board[square] {
                score += piece.kind.relativeValue * (piece.color == .white ? 1.0 : -1.0)
            }
        }
    return score
}
```

Since the values for black pieces are multiplied by -1 and white pieces by +1, material advantage on the board translates to a higher/lower evaluation.

### Recursive Minimax

Taking inspiration from the pseudocode above, we can define a minimax function in Swift as:

```swift
func minimax(depth: Int, isMaximizingPlayer: Bool, alpha: Double, beta: Double) -> Double {
    if depth == 0 || isFinished {
        return evaluate()
    }

    var alpha = alpha
    var beta = beta

    if isMaximizingPlayer {
        var maxEval: Double = -.infinity

        for move in availableMoves() {
            try! execute(uncheckedMove: move)
            let eval = minimax(depth: depth - 1, isMaximizingPlayer: false, alpha: alpha, beta: beta)
            maxEval = max(maxEval, eval)
            undoMove()
            alpha = max(alpha, eval)
            if beta <= alpha {
                break
            }
        }
        return maxEval
    } else {
        var minEval: Double = .infinity
        for move in availableMoves() {
            try! execute(uncheckedMove: move)
            let eval = minimax(depth: depth - 1, isMaximizingPlayer: true, alpha: alpha, beta: beta)
            minEval = min(minEval, eval)
            if beta <= alpha {
                break
            }
        }
        return minEval
    }
}
```

### Best Move

We can now get a score for a move for a given depth, we wrap this up as a public method

```swift
extension Game {
    public func bestMove(depth: Int) -> Move? {
        var bestMove: Move?
        var bestValue: Double = (playerTurn == .white) ? -.infinity : .infinity
        let alpha: Double = -.infinity
        let beta: Double = .infinity

        for move in availableMoves() {
            try! execute(uncheckedMove: move)
            let moveValue = minimax(depth: depth - 1, isMaximizingPlayer: playerTurn.isBlack ? false : true, alpha: alpha, beta: beta)
            undoMove()
            if (playerTurn == .white && moveValue > bestValue) || (playerTurn == .black && moveValue < bestValue) {
                bestValue = moveValue
                bestMove = move
            }
        }
        return bestMove
    }
}
```


## Usage

```swift
import SwiftChessNeo

let game = try! Game(position: Game.Position(fen: "8/5B2/k5p1/4rp2/8/8/PP6/1K3R2 w - - 0 1")!)
let move = game.bestMove(depth: 5)
```

Of course there are tons of improvements you can make to this naive algorithm. A better scoring function that understands the importance of piece positioning would make this even better. The [Chess Programming Wiki](https://www.chessprogramming.org/Main_Page) is an amazing resource if you want to learn more about this.
