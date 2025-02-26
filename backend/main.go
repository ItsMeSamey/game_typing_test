package main

import (
  "backend/common"
  "backend/game"
  "log"
  "time"

  utils "github.com/ItsMeSamey/go_utils"
  "github.com/bytedance/sonic"
  "github.com/gofiber/fiber/v3"
  "github.com/gofiber/fiber/v3/middleware/cors"

  fiberRecover "github.com/gofiber/fiber/v3/middleware/recover"
)

func main() {
  utils.SetErrorStackTrace(common.IsDebug)

  app := fiber.New(fiber.Config{
    CaseSensitive:      true,
    Concurrency:        1024 * 1024,
    IdleTimeout:        30 * time.Second,
    DisableDefaultDate: true,
    JSONEncoder:        sonic.Marshal,
    JSONDecoder:        sonic.Unmarshal,
  })

  app.Use(cors.New())
  app.Use(fiberRecover.New(fiberRecover.Config{EnableStackTrace: common.IsDebug}))

  // Console logging
  if os.Getenv("ZEROLOG") == "true" || (common.IsDebug && os.Getenv("ZEROLOG") != "false") {
    app.Use(fiberzerolog.New())
    log.Println("Zerolog logging enabled")
  } else {
    log.Println("Zerolog logging [[DISABLED]]")
  }
  
  // New Relic logging
  if newRealicLicenceKey, ok := os.LookupEnv("NEW_RELIC_LICENSE_KEY"); ok {
    app.Use(fibernewrelic.New(fibernewrelic.Config{
      License: newRealicLicenceKey,
      AppName: "game_typing_test",
      Enabled: true,
    }))
    log.Println("New Relic logging enabled")
  } else {
    log.Println("New Relic logging [[DISABLED]]")
  }

  game.AddRoutes(app)

  log.Fatal(
    app.Listen("0.0.0.0:8080", fiber.ListenConfig{
      EnablePrintRoutes: true,
    }),
  )
}

