import { useState } from 'react';

type UseFormStateReturn<T> = {
    formState: T;
    handleChange: (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => void;
    resetForm: () => void;
    setFormState: React.Dispatch<React.SetStateAction<T>>;
};

function setNestedValue<T>(
    obj: T,
    path: string[],
    value: unknown
): T {
    if (path.length === 0) return obj;

    const [head, ...rest] = path;
    return {
        ...obj,
        [head]: rest.length > 0
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? setNestedValue((obj as any)[head] ?? {}, rest, value)
            : value,
    };
}

const useFormState = <T>(initialState: T): UseFormStateReturn<T> => {
    const [formState, setFormState] = useState<T>(initialState);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value, type } = e.target;
        const path = name.split('.');

        let finalValue: unknown = value;

        if (type === 'number') {
            finalValue = Number(value);
        }

        if (
            type === 'file' &&
            e.target instanceof HTMLInputElement &&
            e.target.files
        ) {
            finalValue = Array.from(e.target.files);
        }

        if (
            e.target instanceof HTMLSelectElement &&
            e.target.multiple
        ) {
            finalValue = Array.from(e.target.selectedOptions).map((opt) =>
                isNaN(Number(opt.value)) ? opt.value : Number(opt.value)
            );
        }

        setFormState((prev) => setNestedValue(prev, path, finalValue));
    };

    const resetForm = () => {
        setFormState(initialState);
    };

    return {
        formState,
        handleChange,
        resetForm,
        setFormState,
    };
};

export default useFormState;
