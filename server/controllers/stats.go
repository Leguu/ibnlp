package controllers

import (
	"net/http"
	"time"

	"ibnlp/server/model"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

var statsRoutes = route{
	path: "/stats",
	handlers: []handler{
		{http.MethodGet, authenticatedRoute(GetStats)},
	},
}

type ApiStatsRequest struct {
	From time.Time `query:"from"`
	To   time.Time `query:"to"`
}

func GetStats(c echo.Context) error {
	var statsRequest ApiStatsRequest
	if err := c.Bind(&statsRequest); err != nil {
		return c.String(http.StatusBadRequest, "Invalid request")
	}

	db := c.Get("db").(*gorm.DB)

	var chatRequests []model.UserChatRequest

	if result := db.Where("created_at BETWEEN ? AND ?", statsRequest.From, statsRequest.To).Find(&chatRequests); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error fetching stats")
	}

	return c.JSON(http.StatusOK, chatRequests)
}
