package jobs

import (
	"context"
	"fmt"
)

type Handler func(ctx context.Context, job Job) ([]byte, error)

type Registry struct {
	handlers map[Type]Handler
}

func NewRegistry() *Registry {
	return &Registry{handlers: map[Type]Handler{}}
}

func (r *Registry) Register(jobType Type, handler Handler) {
	r.handlers[jobType] = handler
}

func (r *Registry) Handler(jobType Type) (Handler, error) {
	handler, ok := r.handlers[jobType]
	if !ok {
		return nil, fmt.Errorf("job handler not registered: %s", jobType)
	}
	return handler, nil
}
