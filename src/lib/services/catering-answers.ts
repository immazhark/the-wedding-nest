interface ServiceAnswerSource {
  slug: string;
  introduction: string;
  sections: readonly { body: string }[];
}

const CATERING_ANSWERS = [
  {
    question: "Can I customise the menu?",
    answer: "Each menu is a starting point, and we shape it around your family and your guests.",
  },
  {
    question: "Are set prices published?",
    answer: "We do not publish set prices, because the right menu depends on what you ask for.",
  },
] as const;

/** Show only verbatim answers that remain present in the current approved service copy. */
export function cateringAnswers(page: ServiceAnswerSource) {
  if (page.slug !== "hyderabadi-wedding-catering") return [];
  const approved = [page.introduction, ...page.sections.map((section) => section.body)];
  return CATERING_ANSWERS.filter(({ answer }) => approved.some((body) => body.includes(answer)));
}
