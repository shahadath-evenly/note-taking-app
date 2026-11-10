export async function validateForm(schema, values) {
  try {
    const validated = await schema.validate(values, { abortEarly: false, stripUnknown: true });
    return { values: validated, errors: {} };
  } catch (validationError) {
    const errors = {};
    (validationError.inner || []).forEach((innerError) => {
      if (innerError.path && !errors[innerError.path]) {
        errors[innerError.path] = innerError.message;
      }
    });
    if (Object.keys(errors).length === 0 && validationError.message) {
      errors._form = validationError.message;
    }
    return { values: null, errors };
  }
}
