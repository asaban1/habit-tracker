export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain at least one letter and one number";
  }
  return null;
}

export function validateEntryForm(form) {
  const errors = {};
  const todayStr = new Date().toISOString().split("T")[0];
  const dateValue = (form.entry_date || "").trim();

  if (!dateValue) {
    errors.entry_date = "Date is required";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    errors.entry_date = "Enter a valid date";
  } else if (dateValue > todayStr) {
    errors.entry_date = "Date cannot be in the future";
  }

  const checkRequired = (key, label, min, max) => {
    const rawValue = (form[key] ?? "").toString().trim();

    if (rawValue === "") {
      errors[key] = `${label} is required`;
      return;
    }

    const value = Number(rawValue);
    if (Number.isNaN(value)) {
      errors[key] = `${label} must be a number`;
    } else if (value < min || value > max) {
      errors[key] = `${label} must be between ${min} and ${max}`;
    }
  };

  checkRequired("sleep_hours", "Sleep hours", 0, 24);
  checkRequired("sleep_quality", "Sleep quality", 1, 10);
  checkRequired("nutrition_quality", "Nutrition quality", 1, 10);
  checkRequired("physical_activity", "Physical activity", 0, 1440);
  checkRequired("stress_level", "Stress level", 1, 10);
  checkRequired("energy_level", "Energy level", 1, 10);

  return errors;
}