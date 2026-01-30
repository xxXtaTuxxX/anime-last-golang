package service

import (
	"backend/internal/core/domain"
	"backend/internal/core/port"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo     port.UserRepository
	roleRepo port.RoleRepository
}

func NewUserService(repo port.UserRepository, roleRepo port.RoleRepository) *UserService {
	return &UserService{repo: repo, roleRepo: roleRepo}
}

func (s *UserService) Create(name, email, password string, roleID uint, avatarPath string) error {
	existing, _ := s.repo.GetByEmail(email)
	if existing != nil {
		return errors.New("email already taken")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &domain.User{
		Name:     name,
		Email:    email,
		Password: string(hashed),
		RoleID:   roleID,
		Avatar:   avatarPath,
	}

	return s.repo.CreateUser(user)
}

func (s *UserService) GetAll() ([]domain.User, error) {
	return s.repo.GetAllUsers()
}

func (s *UserService) GetByID(id uint) (*domain.User, error) {
	return s.repo.GetUserByID(id)
}

func (s *UserService) Update(id uint, name, email string, password string, roleID uint, avatarPath string) error {
	user, err := s.repo.GetUserByID(id)
	if err != nil {
		return err
	}

	user.Name = name
	user.Email = email
	user.RoleID = roleID
	if avatarPath != "" {
		user.Avatar = avatarPath
	}
	if password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		user.Password = string(hashed)
	}

	// Clear the Role struct to ensure GORM updates the foreign key (RoleID)
	// instead of trying to save the old Role association.
	user.Role = domain.Role{}

	return s.repo.UpdateUser(user)
}

func (s *UserService) Delete(id uint) error {
	return s.repo.DeleteUser(id)
}

func (s *UserService) Search(query string) ([]domain.User, error) {
	return s.repo.SearchUsers(query)
}
