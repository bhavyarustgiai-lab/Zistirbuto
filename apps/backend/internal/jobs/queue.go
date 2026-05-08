package jobs

import "context"

type Queue interface {
	Enqueue(ctx context.Context, job Job) (Job, error)
	ClaimNext(ctx context.Context, workerID string) (Job, bool, error)
	Complete(ctx context.Context, jobID string, resultJSON []byte) error
	Fail(ctx context.Context, jobID string, message string) error
}
