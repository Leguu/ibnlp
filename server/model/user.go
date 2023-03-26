package model

import "github.com/rs/zerolog"

type User struct {
	ID       string `json:"id" gorm:"uniqueIndex"`
	Username string
	Password string
}

func (user User) MarshalZerologObject(e *zerolog.Event) {
	e.
		Str("id", user.ID).
		Str("username", user.Username)
}
