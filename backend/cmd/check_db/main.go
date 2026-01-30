package main

import (
	"fmt"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Category struct {
	ID     uint `gorm:"primaryKey"`
	Name   string
	NameEn string
	Slug   string
}

type Type struct {
	ID     uint `gorm:"primaryKey"`
	Name   string
	NameEn string
	Slug   string
}

type Anime struct {
	ID      uint `gorm:"primaryKey"`
	Title   string
	TitleEn string
	Slug    string
}

func main() {
	// Open database
	db, err := gorm.Open(sqlite.Open("../../saas.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}

	// Check Categories
	var catCount int64
	db.Model(&Category{}).Count(&catCount)
	fmt.Printf("Categories count: %d\n", catCount)

	var cats []Category
	db.Limit(3).Find(&cats)
	fmt.Println("\nFirst 3 Categories:")
	for _, c := range cats {
		fmt.Printf("  ID: %d, Name: %s, NameEn: %s, Slug: %s\n", c.ID, c.Name, c.NameEn, c.Slug)
	}

	// Check Types
	var typeCount int64
	db.Model(&Type{}).Count(&typeCount)
	fmt.Printf("\nTypes count: %d\n", typeCount)

	var types []Type
	db.Limit(3).Find(&types)
	fmt.Println("\nFirst 3 Types:")
	for _, t := range types {
		fmt.Printf("  ID: %d, Name: %s, NameEn: %s, Slug: %s\n", t.ID, t.Name, t.NameEn, t.Slug)
	}

	// Check Animes
	var animeCount int64
	db.Model(&Anime{}).Count(&animeCount)
	fmt.Printf("\nAnimes count: %d\n", animeCount)

	var animes []Anime
	db.Limit(3).Find(&animes)
	fmt.Println("\nFirst 3 Animes:")
	for _, a := range animes {
		fmt.Printf("  ID: %d, Title: %s, TitleEn: %s, Slug: %s\n", a.ID, a.Title, a.TitleEn, a.Slug)
	}

	// Check table schema
	fmt.Println("\n=== Categories Table Columns ===")
	var columns []struct {
		Name string
		Type string
	}
	db.Raw("PRAGMA table_info(categories)").Scan(&columns)
	for _, col := range columns {
		fmt.Printf("  %s (%s)\n", col.Name, col.Type)
	}
}
