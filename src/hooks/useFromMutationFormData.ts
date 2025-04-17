import { useCallback } from 'react';
import { ZodIssue, ZodType } from 'zod';
import { transformObjectToFormData } from '@/utils/transformObjectToFormData';

type UseFormMutationFormDataProps<TForm> = {
    formState: TForm;
    setFormErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof TForm, string>>>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createSchema: ZodType<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateSchema: ZodType<any>;
    createMutation: {
        mutate: (data: FormData, options?: { onSuccess?: () => void }) => void;
    };
    updateMutation: {
        mutate: (data: FormData, options?: { onSuccess?: () => void }) => void;
    };
    onSuccess: () => void;
};

export function useFormMutationFormData<TForm extends { id?: number }>({
    formState,
    setFormErrors,
    createSchema,
    updateSchema,
    createMutation,
    updateMutation,
    onSuccess,
}: UseFormMutationFormDataProps<TForm>) {
    const handleValidationErrors = useCallback(
        (errors: ZodIssue[]) => {
            const mapped = Object.fromEntries(errors.map((err) => [err.path[0], err.message]));
            setFormErrors(mapped as Partial<Record<keyof TForm, string>>);
        },
        [setFormErrors]
    );

    const handleSubmit = useCallback(() => {
        const formData = transformObjectToFormData(formState);

        if (formState.id) {
            const result = updateSchema.safeParse(formData);
            if (!result.success) return handleValidationErrors(result.error.errors);
            updateMutation.mutate(formData, { onSuccess });
        } else {
            const result = createSchema.safeParse(formData);
            if (!result.success) return handleValidationErrors(result.error.errors);
            createMutation.mutate(formData, { onSuccess });
        }
    }, [
        formState,
        createSchema,
        updateSchema,
        createMutation,
        updateMutation,
        onSuccess,
        handleValidationErrors,
    ]);

    return { handleSubmit };
}
