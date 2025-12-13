// Format AI response text with proper structure
export const formatAIResponse = (text) => {
    if (!text) return '';

    // Split into paragraphs
    let formatted = text
        // Add line breaks before numbered lists
        .replace(/(\d+\.\s\*\*)/g, '\n$1')
        // Add line breaks before bullet points
        .replace(/(\*\s\*\*)/g, '\n$1')
        // Format bold text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Format code blocks
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Add line breaks for better readability
        .replace(/\.\s+(?=[A-Z])/g, '.\n\n')
        // Format numbered lists
        .replace(/^(\d+\.)/gm, '<br/>$1')
        // Format bullet points
        .replace(/^\*\s/gm, '<br/>• ')
        // Clean up extra line breaks
        .replace(/\n{3,}/g, '\n\n');

    return formatted;
};

// Parse and structure AI response into sections
export const parseAIResponse = (text) => {
    if (!text) return { sections: [] };

    const sections = [];
    const lines = text.split('\n').filter(line => line.trim());

    let currentSection = null;

    lines.forEach(line => {
        // Check if it's a heading (starts with number followed by **)
        const headingMatch = line.match(/^(\d+)\.\s*\*\*([^*]+)\*\*/);
        if (headingMatch) {
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = {
                title: headingMatch[2].trim(),
                content: []
            };
        } else if (currentSection) {
            currentSection.content.push(line);
        } else {
            // Content before any heading
            if (!sections.length || sections[sections.length - 1].title) {
                sections.push({ title: null, content: [line] });
            } else {
                sections[sections.length - 1].content.push(line);
            }
        }
    });

    if (currentSection) {
        sections.push(currentSection);
    }

    return { sections };
};
