package middleware

import (
	"ibnlp/server/search"

	"github.com/labstack/echo/v4"
)

func RegisterSearchMiddleware(searcher search.Searcher) func(echo.HandlerFunc) echo.HandlerFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("search", searcher)
			if err := next(c); err != nil {
				return err
			}
			return nil
		}
	}
}
