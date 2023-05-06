package controllers

import (
	"net/http"

	"ibnlp/server/middleware"
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

	var existingUser model.User
	if result := db.Unscoped().First(&existingUser, "email = ?", inviteRequest.Email); result.Error == nil {
		if existingUser.Deleted.Valid {
			if result := db.Unscoped().Model(&existingUser).Update("deleted", nil); result.Error != nil {
				return c.String(http.StatusInternalServerError, "Error inviting user")
			}

			return c.JSON(http.StatusOK, existingUser)
		}

		if existingUser.InvitationPending {
			return c.String(http.StatusBadRequest, "User already invited")
		}

		return c.String(http.StatusBadRequest, "User already exists")
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

	session := middleware.GetSessionValues(c)

	var user model.User
	if result := db.First(&user, "id = ?", c.Param("id")); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error fetching user")
	}

	if user.IsAdmin {
		return c.String(http.StatusBadRequest, "You cannot delete an admin user")
	}

	if session.UserID == user.ID {
		return c.String(http.StatusBadRequest, "You cannot delete yourself")
	}

	if result := db.Delete(&user); result.Error != nil {
		return c.String(http.StatusInternalServerError, "Error deleting user")
	}

	return c.JSON(http.StatusOK, user)
}
