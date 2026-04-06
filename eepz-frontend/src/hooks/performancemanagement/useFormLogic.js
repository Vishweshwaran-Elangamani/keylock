import { useState, useEffect, useRef } from "react";
import api from "../../services/performancemanagement/api/api";
import { toast } from "sonner";

export const useFormLogic = (formId, user, navigate, loading) => {
  const isEditMode = !!formId;
  const [currentStep, setCurrentStep] = useState(1);
  const competencyRefs = useRef([]);
  const competencySectionRef = useRef(null);

  const [model, setModel] = useState({
    name: "",
    type: "",
    createdBy: null,
    deliveryEnablement: "",
    competencies: [
      {
        name: "",
        description: "",
        displayOrder: 1,
      },
    ],
  });

  const [busy, setBusy] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (user?.userId) {
      setModel((m) => ({ ...m, createdBy: user.userId }));
    }
  }, [user]);

  useEffect(() => {
    if (!isEditMode) return;

    const loadFormData = async () => {
      try {
        setBusy(true);
        toast.loading("Loading form data...");
        const { data } = await api.get(`/FormManagement/${formId}`);
        const payload = data?.data ?? {};

        const loadedCompetencies =
          payload.competencies && payload.competencies.length > 0
            ? payload.competencies
            : [
                {
                  name: "",
                  description: "",
                  displayOrder: 1,
                },
              ];

        setModel({
          ...payload,
          competencies: loadedCompetencies,
        });
        toast.dismiss();
        toast.success("Form data loaded successfully");
      } catch (error) {
        toast.dismiss();
        toast.error("Failed to load form for editing.");
        console.error(error);
      } finally {
        setBusy(false);
      }
    };

    loadFormData();
  }, [formId, isEditMode]);

  const isStep1Complete = () => {
    return model.name?.trim() && model.type && model.deliveryEnablement;
  };

  const isStep2Complete = () => {
    if (model.competencies.length === 0) return false;
    return model.competencies.every(
      (comp) => comp.name?.trim() && comp.description?.trim()
    );
  };

  const addCompetency = () => {
    const newIndex = model.competencies.length;

    setModel((m) => ({
      ...m,
      competencies: [
        ...m.competencies,
        {
          name: "",
          description: "",
          displayOrder: m.competencies.length + 1,
        },
      ],
    }));

    toast.success("Competency added");

    setTimeout(() => {
      const container = competencySectionRef.current;
      if (container && competencyRefs.current[newIndex]) {
        const element = competencyRefs.current[newIndex];
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const containerHeight = container.clientHeight;

        container.scrollTo({
          top: elementTop - containerHeight + elementHeight + 50,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const updateComp = (index, key, value) => {
    setModel((m) => {
      const next = structuredClone(m);
      next.competencies[index][key] =
        key === "displayOrder" ? Number(value) : value;
      return next;
    });
  };

  const removeComp = (index) => {
    setModel((m) => {
      const next = structuredClone(m);
      next.competencies.splice(index, 1);
      next.competencies.forEach((c, idx) => (c.displayOrder = idx + 1));
      return next;
    });
    toast.info("Competency removed");
  };

  const moveCompUp = (index) => {
    if (index === 0) return;
    setModel((m) => {
      const next = structuredClone(m);
      [next.competencies[index - 1], next.competencies[index]] = [
        next.competencies[index],
        next.competencies[index - 1],
      ];
      next.competencies.forEach((c, idx) => (c.displayOrder = idx + 1));
      return next;
    });

    setTimeout(() => {
      const container = competencySectionRef.current;
      if (container && competencyRefs.current[index - 1]) {
        const element = competencyRefs.current[index - 1];
        container.scrollTo({
          top: element.offsetTop - 100,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const moveCompDown = (index) => {
    if (index === model.competencies.length - 1) return;
    setModel((m) => {
      const next = structuredClone(m);
      [next.competencies[index], next.competencies[index + 1]] = [
        next.competencies[index + 1],
        next.competencies[index],
      ];
      next.competencies.forEach((c, idx) => (c.displayOrder = idx + 1));
      return next;
    });

    setTimeout(() => {
      const container = competencySectionRef.current;
      if (container && competencyRefs.current[index + 1]) {
        const element = competencyRefs.current[index + 1];
        container.scrollTo({
          top: element.offsetTop - 100,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const validateStep1 = () => {
    const errors = {};

    if (!model.name?.trim()) {
      errors.name = "Form name is required";
    }
    if (!model.type) {
      errors.type = "Form type is required";
    }
    if (!model.deliveryEnablement) {
      errors.deliveryEnablement = "Delivery/Enablement selection is required";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fill all required fields");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const errors = {};

    if (model.competencies.length === 0) {
      errors.competencies = "At least one competency is required";
    }

    model.competencies.forEach((comp, idx) => {
      if (!comp.name?.trim()) {
        errors[`comp_${idx}_name`] = `Competency name is required`;
      }
      if (!comp.description?.trim()) {
        errors[`comp_${idx}_description`] = "Description is required";
      }
    });

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix validation errors");
      return false;
    }
    return true;
  };

  const proceedToStep2 = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      setValidationErrors({});
    }
  };

  const goBackToStep1 = () => {
    setCurrentStep(1);
    setValidationErrors({});
  };

  const navigateToStep = (step) => {
    if (step === 1) {
      goBackToStep1();
    } else if (step === 2 && isStep1Complete()) {
      setCurrentStep(2);
      setValidationErrors({});
    }
  };

  const validateForm = () => {
    return validateStep1() && validateStep2();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) {
      toast.error("Authentication loading. Please wait.");
      return;
    }
    if (!validateForm()) {
      return;
    }
    setBusy(true);

    const toPascalCase = (obj) => ({
      Name: obj.name,
      Type: obj.type,
      DeliveryEnablement: obj.deliveryEnablement,
      CreatedBy: obj.createdBy,
      Competencies: obj.competencies.map((c) => ({
        Name: c.name,
        Description: c.description,
        DisplayOrder: c.displayOrder,
      })),
    });

    const payload = toPascalCase(model);

    try {
      toast.loading(isEditMode ? "Updating form..." : "Creating form...");
      const endpoint = isEditMode
        ? `/FormManagement/${formId}`
        : "/FormManagement/create";
      const method = isEditMode ? api.put : api.post;
      const { data } = await method(endpoint, payload);

      toast.dismiss();
      toast.success(
        data.message ||
          (isEditMode
            ? "Form updated successfully!"
            : "Form created successfully!")
      );
      setTimeout(() => {
        navigate("/hr/dashboard/performance/formslist");
      }, 500);
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.response?.data?.message ||
          (isEditMode ? "Failed to update form." : "Failed to create form.")
      );
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return {
    currentStep,
    model,
    setModel,
    busy,
    validationErrors,
    setValidationErrors,
    competencyRefs,
    competencySectionRef,
    addCompetency,
    updateComp,
    removeComp,
    moveCompUp,
    moveCompDown,
    isStep1Complete,
    isStep2Complete,
    proceedToStep2,
    goBackToStep1,
    navigateToStep,
    onSubmit,
    isEditMode,
  };
};
