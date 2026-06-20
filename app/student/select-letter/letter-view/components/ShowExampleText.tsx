
export default function ShowExampleText  ({ text }: { text: string })  {
    if (!text) return null;


    const parts = text.split('-');

    return (

        <span>
            {parts.map((part, index) => (
                <span
                    key={index}

                    className={index % 2 !== 0 ? "text-[#FF6B6B]" : "text-gray-700"}
                >
                    {part}
                </span>
            ))}
        </span>
    );
};
