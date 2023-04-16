package model

import "github.com/rs/zerolog"

type User struct {
	ID            string `json:"id" gorm:"uniqueIndex"`
	Username      string
	Password      string
	Organisations []Organisation `gorm:"many2many:organisation_users;"`
}

func (user User) MarshalZerologObject(e *zerolog.Event) {
	e.
		Str("id", user.ID).
		Str("username", user.Username)
}
