//! None of these functions are thread-safe.
//go:generate go run compile.go

package textgen

/*
#cgo LDFLAGS: -L. -lgen
#include "gen.h"
*/
import "C"

func init() { Init() }

// Init initializes the text generation library.
func Init() {
  C.init()
}

// Deinit deinitializes the text generation library.
func Deinit() {
  C.deinit()
}

// GenWordMarkov generates a random word using the Markov chain and returns it as a Go string.
func genWordMarkov() string {
  result := C.genWordMarkov()
  return C.GoStringN(result.ptr, C.int(result.len))
}

// RollWordMarkov re-rolls the word Markov generator.
func rollWordMarkov() {
  C.rollWordMarkov()
}

