import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { PartnerBrand } from "@shared/types/domain";

const ACTIVE_BRAND_STORAGE_KEY = "zistributo.partners.activeBrandId";

function storageKey(firmId: number | string) {
  return `${ACTIVE_BRAND_STORAGE_KEY}:${firmId}`;
}

function readStoredBrandId(firmId: number | string) {
  if (!firmId || typeof window === "undefined") return "";
  return window.localStorage.getItem(storageKey(firmId)) ?? "";
}

function writeStoredBrandId(firmId: number | string, brandId: string) {
  if (!firmId || !brandId || typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(firmId), brandId);
}

export function usePartnerBrandSelection(
  firmId: number | string,
  brands: PartnerBrand[],
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryBrandId = searchParams.get("brand") ?? "";
  const [brandId, setBrandId] = useState("");

  const brandOptions = useMemo(
    () => brands.map((brand) => ({ value: String(brand.id), label: brand.name })),
    [brands],
  );

  const validBrandIds = useMemo(
    () => new Set(brands.map((brand) => String(brand.id))),
    [brands],
  );

  useEffect(() => {
    if (!firmId || brands.length === 0) {
      setBrandId("");
      return;
    }

    const storedBrandId = readStoredBrandId(firmId);
    const nextBrandId =
      queryBrandId && validBrandIds.has(queryBrandId)
        ? queryBrandId
        : storedBrandId && validBrandIds.has(storedBrandId)
          ? storedBrandId
          : String(brands[0].id);

    setBrandId((current) => (current === nextBrandId ? current : nextBrandId));
    writeStoredBrandId(firmId, nextBrandId);

    if (queryBrandId !== nextBrandId) {
      const next = new URLSearchParams(searchParams);
      next.set("brand", nextBrandId);
      setSearchParams(next, { replace: true });
    }
  }, [
    brands,
    firmId,
    queryBrandId,
    searchParams,
    setSearchParams,
    validBrandIds,
  ]);

  const selectBrandId = useCallback(
    (nextBrandId: string) => {
      setBrandId(nextBrandId);
      writeStoredBrandId(firmId, nextBrandId);
      const next = new URLSearchParams(searchParams);
      next.set("brand", nextBrandId);
      setSearchParams(next, { replace: true });
    },
    [firmId, searchParams, setSearchParams],
  );

  return {
    brandId,
    brandOptions,
    setBrandId: selectBrandId,
  };
}
