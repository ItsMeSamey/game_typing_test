package game

import (
  "strings"

  "backend/game/text_gen"

  "github.com/gofiber/fiber/v3"
)

var textPool = make(chan string, 1 << 12)

const STRING_WORD_COUNT = 32

// Since only one thead is generating, thread safety is not needed
func init() {
  go func() {
    for { textPool <- strings.Join(textgen.GenNReroll(STRING_WORD_COUNT), " ") }
  }()
}

func GenerateText() string {
  return <-textPool
}

func AddRoutes(router fiber.Router) {

}

