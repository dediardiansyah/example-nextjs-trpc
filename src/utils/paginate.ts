interface PaginationInput {
    page?: number;
    limit?: number;
}

interface PaginatedResult<T> {
    data: T[];
    total: number;
    currentPage?: number;
    prevPage?: number | null;
    nextPage?: number | null;
    lastPage?: number;
}

export const paginate = async <T>(
    model: {
        findMany: Function;
        count: Function;
    },
    options: {
        where?: any;
        orderBy?: any;
        select?: any;
        include?: any;
        omit?: any;
    } = {},
    pagination?: PaginationInput
): Promise<PaginatedResult<T>> => {
    const hasPage = typeof pagination?.page !== 'undefined';
    const limit = pagination?.limit ?? (hasPage ? 10 : undefined);
    const currentPage = pagination?.page ?? 1;

    if (limit) {
        const [data, total] = await Promise.all([
            model.findMany({
                ...options,
                skip: (currentPage - 1) * limit,
                take: limit,
            }),
            model.count({
                where: options.where,
            }),
        ]);

        const lastPage = Math.ceil(total / limit);
        const nextPage = currentPage < lastPage ? currentPage + 1 : null;
        const prevPage = currentPage > 1 ? currentPage - 1 : null;

        return {
            data,
            total,
            prevPage,
            currentPage,
            nextPage,
            lastPage,
        };
    }

    const data = await model.findMany(options);
    return {
        data,
        total: data.length,
    };
};
