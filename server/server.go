package server

import (
	"context"
	"log"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"

	"ibnlp/search"
	"ibnlp/server/controllers"
	"ibnlp/server/middleware"

	"github.com/glebarez/sqlite"
	"github.com/labstack/echo/v4"
	eMiddleware "github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo-contrib/session"
)

func runProductionClient() (*exec.Cmd, context.CancelFunc) {
	ctx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(ctx, "npm", "run", "start")
	cmd.Dir = "./view"
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		panic("failed to build frontend")
	}
	log.Println("Frontend started")
	return cmd, cancel
}

func runDevelopmentClient() (*exec.Cmd, context.CancelFunc) {
	ctx, cancel := context.WithCancel(context.Background())
	cmd := exec.CommandContext(ctx, "npm", "run", "dev")
	cmd.Dir = "./view"
	cmd.Stdout = os.Stdout
	cmd.Stdin = os.Stdin
	if err := cmd.Start(); err != nil {
		panic("failed to build dev")
	}
	log.Println("Dev build started")
	return cmd, cancel
}

func setUpProxy(e *echo.Echo) {
	developmentPort := os.Getenv("DEVELOPMENT_PORT")

	target, err := url.Parse("http://localhost:" + developmentPort)
	if err != nil {
		panic("failed to parse development port. have you set the DEVELOPMENT_PORT environment variable?")
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	e.Any("/*", func(c echo.Context) error {
		proxy.ServeHTTP(c.Response(), c.Request())
		return nil
	})
}

func setUpDev(e *echo.Echo) {
	loggerConfig := eMiddleware.DefaultLoggerConfig
	loggerConfig.Format = "${method} ${status} ${path} - ${query} ${error}\n"
	e.Use(eMiddleware.LoggerWithConfig(loggerConfig))

	setUpProxy(e)
}

func RunServer(dev bool) error {
	db, err := gorm.Open(sqlite.Open("ibnlp.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	e := echo.New()
	e.Use(eMiddleware.Recover())

	searcher, err := search.NewPythonSearcher()
	if err != nil {
		log.Fatal(err)
	}

	e.Use(session.Middleware(sessions.NewCookieStore([]byte("secret"))))
	e.Use(middleware.RegisterDbMiddleware(db))
	e.Use(middleware.RegisterSearchMiddleware(searcher))

	development := os.Getenv("ENV") == "DEVELOPMENT" || dev

	if development {
		setUpDev(e)
		// _, cancel := runDevelopmentClient()
		// defer cancel()
		log.Println("Serving development build")
	} else {
		// _, cancel := runProductionClient()
		// defer cancel()
		setUpProxy(e)
		log.Println("Serving production build")
	}

	e.Pre(eMiddleware.RemoveTrailingSlash())

	apiRoutes := e.Group("/api")
	controllers.SetUpRoutes(apiRoutes)

	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "8080"
	}

	e.IPExtractor = echo.ExtractIPFromRealIPHeader()

	return e.Start(":" + serverPort)
}
