//! None of these functions are thread-safe.
//go:generate go run compile.go

package textgen

/*
#cgo LDFLAGS: -L. -lgen

#cgo nocallback init

#cgo nocallback deinit

#cgo noescape genN
#cgo nocallback genN

#cgo noescape freeString
#cgo nocallback freeString

#include "gen.h"
*/
import "C"
import "unsafe"

// Magic init
func init() { Init() }

// Init initializes the text generation library.
func Init() {
  C.init()
}

// Deinit deinitializes the text generation library.
func Deinit() {
  C.deinit()
}

type StringStruct struct {
  Ptr *C.uint8_t
  Len uint32
  Cap uint32
}

func (s StringStruct) String() string {
  return C.GoStringN((*C.char)(unsafe.Pointer(s.Ptr)), C.int(s.Len))
}

// Free frees the string struct.
func (s StringStruct) Free() {
  C.freeString(C.StringStruct{ptr: s.Ptr, len: C.uint32_t(s.Len), cap: C.uint32_t(s.Cap)})
}

type IdType uint8

const (
  IdWordsAlpha = IdType(0)
  IdWordsNonAlpha = IdType(1)
  IdSentence = IdType(2)
  IdCharMarkov = IdType(3)
  IdWordMarkov = IdType(4)
)

// generates a string of random words.
func GenN(state *uint32, n uint16, id IdType) StringStruct {
  str := C.genN((*C.uint32_t)(state), C.uint16_t(n), C.uint8_t(id))
  return StringStruct{Ptr: str.ptr, Len: uint32(str.len), Cap: uint32(str.cap)}
}

