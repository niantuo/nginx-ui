package utils

import (
	"context"
	"github.com/mholt/archiver/v4"
	"os"
	"path/filepath"
	"strings"
)

func IsExist(path string) bool {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false
	}
	return true
}

func TarXz(dst string, src string) error {
	src = filepath.Clean(src)
	dst = filepath.Clean(dst)
	if !strings.HasSuffix(src, string(os.PathSeparator)) {
		src += string(os.PathSeparator)
	}
	files, err := archiver.FilesFromDisk(nil, map[string]string{
		src: "",
	})
	if err != nil {
		return err
	}

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	var compression archiver.Compression
	if strings.HasSuffix(dst, "gz") {
		compression = archiver.Gz{}
	} else if strings.HasSuffix(dst, "xz") {
		compression = archiver.Xz{}
	} else {
		compression = archiver.Gz{}
	}
	format := archiver.CompressedArchive{
		Compression: compression,
		Archival:    archiver.Tar{},
	}
	err = format.Archive(context.Background(), out, files)
	if err != nil {
		return err
	}
	return nil
}
