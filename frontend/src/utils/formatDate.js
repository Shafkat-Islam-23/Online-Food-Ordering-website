export const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};
