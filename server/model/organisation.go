package model

type Organisation struct {
	ID    string `json:"id" gorm:"uniqueIndex"`
	Name  string
	Users []User `gorm:"many2many:organisation_users;"`
}
