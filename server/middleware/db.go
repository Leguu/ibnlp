package middleware

import (
	"ibnlp/server/model"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func migrateDb(db *gorm.DB) {
	db.AutoMigrate(&model.User{})
	db.AutoMigrate(&model.Organisation{})
}

func RegisterDbMiddleware(db *gorm.DB) func(echo.HandlerFunc) echo.HandlerFunc {
	migrateDb(db)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("db", db)
			if err := next(c); err != nil {
				return err
			}
			return nil
		}
	}
}
