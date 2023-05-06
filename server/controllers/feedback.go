package controllers

import (
	"net/http"

	"ibnlp/server/middleware"
	"ibnlp/server/model"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

var feedbackRoutes = route{
	path: "/feedback",
	handlers: []handler{
		{http.MethodPost, authenticatedRoute(PostFeedback)},
		{http.MethodGet, adminRoute(GetFeedback)},
	},
	children: []route{
		{path: "/:id", handlers: []handler{
			{http.MethodDelete, adminRoute(DeleteFeedback)},
		}},
	},
}

type ApiFeedbackRequest struct {
	Feedback string `json:"feedback"`
}

func PostFeedback(c echo.Context) error {
	session := middleware.GetSessionValues(c)

	var user model.User
	db := c.Get("db").(*gorm.DB)
	if result := db.Preload("Feedback").First(&user, "id = ?", session.UserID); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error fetching user")
	}

	var feedbackRequest ApiFeedbackRequest
	if err := c.Bind(&feedbackRequest); err != nil {
		return c.String(http.StatusBadRequest, "Invalid request")
	}

	var feedback model.UserFeedback
	feedback.Feedback = feedbackRequest.Feedback

	user.Feedback = append(user.Feedback, feedback)

	if result := db.Save(&user); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error saving feedback")
	}

	return c.String(http.StatusOK, "Feedback saved")
}

func GetFeedback(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)

	var feedback []model.UserFeedback

	if result := db.Order("created_at DESC").Find(&feedback); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error fetching feedback")
	}

	return c.JSON(http.StatusOK, feedback)
}

func DeleteFeedback(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)

	id := c.Param("id")

	if result := db.Delete(&model.UserFeedback{}, id); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error deleting feedback")
	}

	return c.String(http.StatusOK, "Feedback deleted")
}
