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

// generates a string of random words.
func genN(state *uint32, n uint16, id uint8) StringStruct {
  str := C.genN((*C.uint32_t)(state), C.uint16_t(n), C.uint8_t(id))
  return StringStruct{Ptr: str.ptr, Len: uint32(str.len), Cap: uint32(str.cap)}
}

