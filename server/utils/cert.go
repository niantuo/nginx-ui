package utils

import (
	"crypto/x509"
	"encoding/pem"
)

func CheckHttps(pub string) (*x509.Certificate, error) {
	skBlock, _ := pem.Decode([]byte(pub))
	cert, err := x509.ParseCertificate(skBlock.Bytes)
	return cert, err
}
