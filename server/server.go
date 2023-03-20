package server

import (
	"log"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"

	"ibnlp/search"
	"ibnlp/server/controllers"
	"ibnlp/server/middleware"

	"github.com/labstack/echo/v4"
	eMiddleware "github.com/labstack/echo/v4/middleware"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo-contrib/session"
)

func buildViewProductionBuild() {
	cmd := exec.Command("npm", "run", "build")
	cmd.Dir = "./view"
	if err := cmd.Run(); err != nil {
		panic("failed to build frontend")
	}
	log.Println("Frontend built successfully")
}

func runViewDevelopmentBuild() *exec.Cmd {
	cmd := exec.Command("npm", "run", "dev")
	cmd.Dir = "./view"
	cmd.Stdout = os.Stdout
	cmd.Stdin = os.Stdin
	cmd.Start()
	log.Println("Dev build started successfully")
	return cmd
}

func setUpDev(e *echo.Echo) {
	developmentPort := os.Getenv("DEVELOPMENT_PORT")

	target, err := url.Parse("http://localhost:" + developmentPort)
	if err != nil {
		panic("failed to parse development port. have you set the DEVELOPMENT_PORT environment variable?")
	}

	loggerConfig := eMiddleware.DefaultLoggerConfig
	loggerConfig.Format = "${method} ${status} ${path} - ${query} ${error}\n"
	e.Use(eMiddleware.LoggerWithConfig(loggerConfig))

	proxy := httputil.NewSingleHostReverseProxy(target)

	e.Any("/*", func(c echo.Context) error {
		proxy.ServeHTTP(c.Response(), c.Request())
		return nil
	})
}

func RunServer(dev bool) error {
	e := echo.New()
	e.Use(eMiddleware.Recover())

	searcher, err := search.NewPythonSearcher()
	if err != nil {
		log.Fatal(err)
	}

	e.Use(session.Middleware(sessions.NewCookieStore([]byte("secret"))))
	e.Use(middleware.RegisterSearchMiddleware(searcher))
	e.Use(middleware.RegisterSessionMiddleware())

	development := os.Getenv("ENV") == "DEVELOPMENT" || dev

	// var developmentBuild *exec.Cmd
	if development {
		log.Println("Serving development build")
		setUpDev(e)
		// developmentBuild := runViewDevelopmentBuild()
		// defer developmentBuild.Process.Kill()
	} else {
		// buildViewProductionBuild()
		log.Println("Serving production build")
		e.Static("/*", "./view/out")
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
