package orders

import "github.com/zistributo/zistributo/apps/backend/internal/store"

type CreateRequest = store.CreatePartnerOrderInput

type UpdateRequest = store.UpdatePartnerOrderInput

type StatusRequest = store.UpdatePartnerOrderStatusInput

type CreateReturnRequest = store.CreatePartnerOrderReturnInput

type Order = store.PartnerOrder

type Return = store.PartnerSalesReturn

type ReturnResponse = store.CreatePartnerOrderReturnResponse
