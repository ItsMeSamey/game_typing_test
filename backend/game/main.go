package game

import (
  "strconv"

  "backend/game/text_gen"

  utils "github.com/ItsMeSamey/go_utils"
  "github.com/gofiber/fiber/v3"
)

func AddRoutes(router fiber.Router) {
  router.Get("/gen", func(c fiber.Ctx) (err error) {
    id, err := strconv.Atoi(utils.B2S(c.Request().Header.Peek("id")))
    if err = utils.WithStack(err); err != nil { return }
    if id < 0 || id > 4 { return utils.WithStack(fiber.ErrBadRequest) }

    count, err := strconv.Atoi(utils.B2S(c.Request().Header.Peek("count")))
    if err = utils.WithStack(err); err != nil { return }
    if count > (1 << 16) { return utils.WithStack(fiber.ErrBadRequest) }

    state, err := strconv.Atoi(utils.B2S(c.Request().Header.Peek("state")))
    if err = utils.WithStack(err); err != nil { return }

    uint32_state := uint32(state)
    str := textgen.GenN(&uint32_state, uint16(count - 1), textgen.IdType(id))
    defer str.Free()

    return c.SendString(strconv.Itoa(int(uint32_state)) + "\n" + str.String())
  })
}

