package phone

import (
	"fmt"
	"strings"
)

func NormalizeE164(value string) (string, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", fmt.Errorf("phone is required")
	}
	var builder strings.Builder
	for index, r := range trimmed {
		switch {
		case r >= '0' && r <= '9':
			builder.WriteRune(r)
		case r == '+' && index == 0:
			builder.WriteRune(r)
		case r == ' ' || r == '-' || r == '(' || r == ')':
			continue
		default:
			return "", fmt.Errorf("phone must contain only digits and an optional leading +")
		}
	}

	normalized := builder.String()
	switch {
	case strings.HasPrefix(normalized, "+91"):
		if len(normalized) != 13 {
			return "", fmt.Errorf("India (+91) phone numbers must have exactly 10 digits")
		}
		return normalized, nil
	case strings.HasPrefix(normalized, "+1"):
		if len(normalized) != 12 {
			return "", fmt.Errorf("US (+1) phone numbers must have exactly 10 digits")
		}
		return normalized, nil
	default:
		return "", fmt.Errorf("only India (+91) and US (+1) phone numbers are supported")
	}
}
