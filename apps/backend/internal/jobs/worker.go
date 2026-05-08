package jobs

import "context"

type Worker struct {
	ID       string
	Queue    Queue
	Registry *Registry
}

func (w Worker) RunOnce(ctx context.Context) (bool, error) {
	job, ok, err := w.Queue.ClaimNext(ctx, w.ID)
	if err != nil || !ok {
		return ok, err
	}
	handler, err := w.Registry.Handler(job.Type)
	if err != nil {
		return true, w.Queue.Fail(ctx, job.ID, err.Error())
	}
	result, err := handler(ctx, job)
	if err != nil {
		return true, w.Queue.Fail(ctx, job.ID, err.Error())
	}
	return true, w.Queue.Complete(ctx, job.ID, result)
}
