import mongoose from "mongoose";
import Company from "../models/Company.js";

const normalizeCompanyType = (roleOrType = "") => {
  const normalized = String(roleOrType || "").trim().toLowerCase();
  if (normalized.includes("vendor")) return "vendor";
  return "client";
};

export const resolveCompany = async ({
  companyId,
  organization,
  type,
  externalId = "",
  email = "",
  phone = "",
  address = "",
}) => {
  const resolvedType = normalizeCompanyType(type);
  const lookupValue = String(companyId || organization || "").trim();

  let company = null;

  if (lookupValue && mongoose.Types.ObjectId.isValid(lookupValue)) {
    company = await Company.findById(lookupValue);
  }

  if (!company && lookupValue) {
    company =
      (await Company.findOne({
        $or: [{ name: lookupValue }, { externalId: lookupValue }],
        type: resolvedType,
      })) || null;
  }

  if (!company && organization) {
    company = await Company.create({
      name: organization,
      type: resolvedType,
      externalId: externalId || lookupValue || "",
      email,
      phone,
      address,
    });
  }

  return company;
};

export const syncCompanyUser = async (companyId, userId) => {
  if (!companyId || !userId) return null;
  return Company.findByIdAndUpdate(
    companyId,
    { $addToSet: { users: userId } },
    { new: true },
  );
};
