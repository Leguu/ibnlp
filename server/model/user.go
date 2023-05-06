package model

import (
	"time"

	"github.com/rs/zerolog"
	"gorm.io/gorm"
)

type UserChatRequest struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Deleted   gorm.DeletedAt
	UserId    string
	Request   string
	Response  string
}

type UserFeedback struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	Feedback  string
	UserId    string
}

type User struct {
	ID                string `json:"id" gorm:"uniqueIndex"`
	Name              string
	Email             string
	Password          string
	Organisations     []Organisation `gorm:"many2many:organisation_users;"`
	ChatRequests      []UserChatRequest
	IsAdmin           bool
	InvitationPending bool
	Deleted           gorm.DeletedAt
	Feedback          []UserFeedback
}

func (user User) MarshalZerologObject(e *zerolog.Event) {
	e.
		Str("id", user.ID).
		Str("username", user.Email)
}
