package apperrors

import (
	"errors"
	"net/http"
)

type Kind string

const (
	KindValidation   Kind = "validation"
	KindUnauthorized Kind = "unauthorized"
	KindForbidden    Kind = "forbidden"
	KindNotFound     Kind = "not_found"
	KindConflict     Kind = "conflict"
	KindInternal     Kind = "internal"
)

type Error struct {
	Kind        Kind              `json:"-"`
	Message     string            `json:"error"`
	FieldErrors map[string]string `json:"fieldErrors,omitempty"`
}

func (e Error) Error() string {
	return e.Message
}

func New(kind Kind, message string) Error {
	return Error{Kind: kind, Message: message}
}

func Validation(message string) Error {
	return New(KindValidation, message)
}

func Unauthorized(message string) Error {
	return New(KindUnauthorized, message)
}

func Forbidden(message string) Error {
	return New(KindForbidden, message)
}

func NotFound(message string) Error {
	return New(KindNotFound, message)
}

func Conflict(message string) Error {
	return New(KindConflict, message)
}

func Internal(message string) Error {
	return New(KindInternal, message)
}

func WithFieldErrors(message string, fields map[string]string) Error {
	return Error{Kind: KindValidation, Message: message, FieldErrors: fields}
}

func As(err error) (Error, bool) {
	var appErr Error
	if errors.As(err, &appErr) {
		return appErr, true
	}
	return Error{}, false
}

func HTTPStatus(err Error) int {
	switch err.Kind {
	case KindValidation:
		return http.StatusBadRequest
	case KindUnauthorized:
		return http.StatusUnauthorized
	case KindForbidden:
		return http.StatusForbidden
	case KindNotFound:
		return http.StatusNotFound
	case KindConflict:
		return http.StatusConflict
	default:
		return http.StatusInternalServerError
	}
}
