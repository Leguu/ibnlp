package controllers

import (
	"net/http"

	"ibnlp/server/model"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

var adminRoutes = route{
	path: "/admin",
	children: []route{
		{
			path: "/users",
			handlers: []handler{
				{http.MethodGet, adminRoute(GetUsers)},
			},
			children: []route{
				{path: "/:id", handlers: []handler{{http.MethodDelete, adminRoute(DeleteUser)}}},
				{path: "/invite", handlers: []handler{{http.MethodPost, adminRoute(InviteUser)}}},
			},
		},
	},
}

func GetUsers(c echo.Context) error {
	var users []model.User
	db := c.Get("db").(*gorm.DB)

	if result := db.Find(&users); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error fetching users")
	}

	return c.JSON(http.StatusOK, users)
}

type ApiInviteUserRequest struct {
	Email string `json:"email"`
}

func InviteUser(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)

	var inviteRequest ApiInviteUserRequest
	if err := c.Bind(&inviteRequest); err != nil {
		return c.String(http.StatusBadRequest, "Invalid request")
	}

	user := model.User{
		ID:                uuid.New().String(),
		Email:             inviteRequest.Email,
		InvitationPending: true,
	}

	if result := db.Create(&user); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error creating user")
	}

	return c.JSON(http.StatusOK, user)
}

func DeleteUser(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)

	var user model.User
	if result := db.First(&user, "id = ?", c.Param("id")); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error fetching user")
	}

	if result := db.Delete(&user); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error deleting user")
	}

	return c.JSON(http.StatusOK, user)
}
