import type { Category, Level, MultiplicationStage } from "./quant-engine.ts";
import { MULTIPLICATION_LESSONS } from "./multiplication-lessons.ts";

export type LessonStep = { title: string; calculation: string; answer: string; explanation: string };
export type LessonExample = { expression: string; answer: string; steps: LessonStep[] };
export type LessonDrill = { expression: string; answer: string; explanation: string };
export type Lesson = {
  id: string; category: Category; level: Level; title: string; summary: string;
  when: string; rule: string; memory: string; pitfall: string;
  example: LessonExample; guided: LessonExample; drills: LessonDrill[];
  multiplicationStage?: MultiplicationStage;
};
const step = (title: string, calculation: string, answer: string, explanation: string): LessonStep => ({ title, calculation, answer, explanation });
const drill = (expression: string, answer: string, explanation: string): LessonDrill => ({ expression, answer, explanation });
export const LESSONS: Lesson[] = [
  ...MULTIPLICATION_LESSONS,
  {
    id: "place-value", category: "multiplication", level: 1,
    title: "Start with two digits × one digit", summary: "Work from the largest place value down, updating one running total.",
    when: "A two- or three-digit number is multiplied by a single digit. This is also a foundation for larger products.",
    rule: "Split a number into tens and ones. The distributive property lets you multiply each part separately, then add the results.",
    memory: "Keep one running total in mind: for example, 210 → 266. Update it as soon as you finish the next part.",
    pitfall: "30 × 7 is 210, not 21. Work out 3 × 7 first, then account for the tens place.",
    example: { expression: "38 × 7", answer: "266", steps: [
      step("Multiply the tens", "30 × 7", "210", "38 = 30 + 8. Hold on to 210 first."),
      step("Multiply the ones", "8 × 7", "56", "The ones contribute 56. Add this to your running total next."),
      step("Update the total", "210 + 56", "266", "Add 50 to reach 260, then add 6 to reach 266.")
    ] },
    guided: { expression: "46 × 8", answer: "368", steps: [
      step("Start with the tens", "40 × 8", "320", "Split 46 into 40 + 6, and keep 320 in mind."),
      step("Multiply the remaining ones", "6 × 8", "48", "The remaining part contributes 48."),
      step("Update the running total", "320 + 48", "368", "320 + 40 + 8 = 368.")
    ] },
    drills: [drill("27 × 6", "162", "20 × 6 + 7 × 6 = 120 + 42 = 162."), drill("64 × 7", "448", "60 × 7 + 4 × 7 = 420 + 28 = 448."), drill("123 × 4", "492", "Add from the largest place value down: 400 → 480 → 492.")]
  },
  {
    id: "split-multiplier", category: "multiplication", level: 2,
    title: "Multiply two- and three-digit numbers", summary: "Split the shorter factor to turn one large product into two smaller ones.",
    when: "Both factors have two digits, or you have three digits × two digits, and neither factor is especially close to a convenient hundred.",
    rule: "a × (20 + b) = a × 20 + a × b. Calculate the larger part first, then add the smaller part.",
    memory: "For 214 × 23, start with 4,280, then add 642 in two stages: add 600, then 42.",
    pitfall: "To multiply by 20, multiply by 2 and then by 10. Splitting both factors at once creates four partial products to remember.",
    example: { expression: "47 × 26", answer: "1222", steps: [
      step("Split off 20", "47 × 20", "940", "26 = 20 + 6. Since 47 × 2 = 94, this part is 940."),
      step("Multiply by the remaining 6", "47 × 6", "282", "40 × 6 + 7 × 6 = 240 + 42 = 282."),
      step("Add the two parts", "940 + 282", "1222", "940 → 1,220 → 1,222.")
    ] },
    guided: { expression: "214 × 23", answer: "4922", steps: [
      step("Multiply by 20 first", "214 × 20", "4280", "214 × 2 = 428, then multiply by 10."),
      step("Multiply by 3", "214 × 3", "642", "600 + 30 + 12 = 642."),
      step("Add in two smaller steps", "4280 + 642", "4922", "Add 600 to reach 4,880, then add 42 to reach 4,922.")
    ] },
    drills: [drill("36 × 24", "864", "36 × 20 + 36 × 4 = 720 + 144 = 864."), drill("72 × 31", "2232", "72 × 30 + 72 = 2,160 + 72 = 2,232."), drill("123 × 42", "5166", "123 × 40 + 123 × 2 = 4,920 + 246 = 5,166.")]
  },
  {
    id: "multiply-compensate", category: "multiplication", level: 2,
    title: "Round, then adjust", summary: "Replace 19, 49 or 99 with a nearby multiple of ten or hundred.",
    when: "One factor is close to an easy number such as 10, 20, 50 or 100.",
    rule: "a × (B − d) = a × B − a × d. If the original factor is larger than B, add the adjustment instead.",
    memory: "Keep the product with the rounded factor in mind, then make one adjustment.",
    pitfall: "The adjustment is a × d, not just d. Rounding 19 up to 20 adds one whole extra copy of a.",
    example: { expression: "64 × 19", answer: "1216", steps: [
      step("Replace 19 with 20", "64 × 20", "1280", "20 is 1 more than 19, so this includes one extra copy of 64."),
      step("Find the extra amount", "64 × 1", "64", "This is the amount to subtract."),
      step("Subtract the adjustment", "1280 − 64", "1216", "Subtract 60 to reach 1,220, then subtract 4.")
    ] },
    guided: { expression: "237 × 99", answer: "23463", steps: [
      step("Multiply by 100 first", "237 × 100", "23700", "Think of 99 as 100 − 1."),
      step("Find the adjustment", "237 × 1", "237", "There is one extra copy of 237."),
      step("Make the final adjustment", "23700 − 237", "23463", "Subtract 200, then subtract 37.")
    ] },
    drills: [drill("48 × 29", "1392", "48 × 30 − 48 = 1,440 − 48 = 1,392."), drill("83 × 51", "4233", "83 × 50 + 83 = 4,150 + 83 = 4,233."), drill("312 × 98", "30576", "312 × 100 − 312 × 2 = 31,200 − 624 = 30,576.")]
  },
  {
    id: "halve-double", category: "multiplication", level: 2,
    title: "Halve one factor, double the other", summary: "Keep the product unchanged while making the factors easier to handle.",
    when: "One factor is even and doubling the other produces a multiple of ten, as with 35, 45 or 75.",
    rule: "a × b = (a ÷ 2) × (2b). Dividing one factor by 2 and multiplying the other by 2 cancel each other out.",
    memory: "Replace the pair of factors together: for example, 16 × 35 → 8 × 70.",
    pitfall: "Whenever you halve one factor, you must double the other. Before repeating the process, check whether it will make the calculation easier.",
    example: { expression: "16 × 35", answer: "560", steps: [
      step("Halve 16", "16 ÷ 2", "8", "Choose the factor that is easy to halve and turn it into 8."),
      step("Double 35 to match", "35 × 2", "70", "The new calculation is 8 × 70, with the same product."),
      step("Calculate the easier product", "8 × 70", "560", "8 × 7 = 56, then multiply by 10.")
    ] },
    guided: { expression: "24 × 45", answer: "1080", steps: [
      step("Halve 24", "24 ÷ 2", "12", "Remember the new first factor, 12."),
      step("Double 45", "45 × 2", "90", "The calculation becomes 12 × 90."),
      step("Multiply by the multiple of ten", "12 × 90", "1080", "12 × 9 = 108, then multiply by 10.")
    ] },
    drills: [drill("18 × 35", "630", "18 × 35 = 9 × 70 = 630."), drill("32 × 75", "2400", "32 × 75 → 16 × 150 → 8 × 300 = 2,400."), drill("28 × 45", "1260", "28 × 45 = 14 × 90 = 1,260.")]
  },
  {
    id: "friendly-factors", category: "multiplication", level: 2,
    title: "Multiply by 5, 25 and 125", summary: "Use these factors as fractions of 10, 100 and 1000.",
    when: "A factor is 5, 25 or 125, especially when the other factor divides easily by 2, 4 or 8.",
    rule: "Multiply by 5: multiply by 10, then divide by 2. Multiply by 25: multiply by 100, then divide by 4. Multiply by 125: multiply by 1000, then divide by 8.",
    memory: "When the division is exact, divide first to keep the numbers small. Otherwise, you can multiply first and divide afterwards.",
    pitfall: "Use division by 8 for ×125, and division by 4 for ×25. Start from the identity 125 = 1000 ÷ 8.",
    example: { expression: "48 × 25", answer: "1200", steps: [
      step("Use 25 = 100 ÷ 4 and divide first", "48 ÷ 4", "12", "48 divides exactly by 4, so start by making the number smaller."),
      step("Multiply by 100", "12 × 100", "1200", "This gives exactly the same result as 48 × 100 ÷ 4.")
    ] },
    guided: { expression: "56 × 125", answer: "7000", steps: [
      step("Use 125 = 1000 ÷ 8 and divide by 8", "56 ÷ 8", "7", "Start with the small whole number 7."),
      step("Multiply by 1000", "7 × 1000", "7000", "So 56 × 125 = 7,000.")
    ] },
    drills: [drill("86 × 5", "430", "86 ÷ 2 × 10 = 43 × 10 = 430."), drill("72 × 25", "1800", "72 ÷ 4 × 100 = 18 × 100 = 1,800."), drill("32 × 125", "4000", "32 ÷ 8 × 1000 = 4,000.")]
  },
  {
    id: "square-ending-five", category: "multiplication", level: 2,
    title: "Square a number ending in 5", summary: "Multiply the preceding digits by the next whole number, then append 25.",
    when: "You multiply a positive whole number ending in 5 by itself, as in 35 × 35 or 115 × 115.",
    rule: "If the number is 10n + 5, its square is 100 × n × (n + 1) + 25.",
    memory: "For 65, take the leading 6: 6 × 7 = 42. Append 25 to get 4,225.",
    pitfall: "This shortcut applies to the square of a number ending in 5. It does not apply to a product such as 65 × 75.",
    example: { expression: "65 × 65", answer: "4225", steps: [
      step("Remove the final 5 and multiply by the next whole number", "6 × 7", "42", "The next whole number after 6 is 7."),
      step("Put 25 in the final two places", "42 × 100 + 25", "4225", "Appending two digits means multiplying by 100, then adding 25.")
    ] },
    guided: { expression: "115 × 115", answer: "13225", steps: [
      step("Take the leading 11 and multiply by 12", "11 × 12", "132", "The same rule works for three-digit numbers."),
      step("Append 25", "132 × 100 + 25", "13225", "The result is 13,225. Calculating 132 + 25 would give the wrong place values.")
    ] },
    drills: [drill("35 × 35", "1225", "3 × 4 = 12. Append 25 to get 1,225."), drill("85 × 85", "7225", "8 × 9 = 72. Append 25 to get 7,225."), drill("105 × 105", "11025", "10 × 11 = 110. Append 25 to get 11,025.")]
  },
  {
    id: "difference-squares", category: "multiplication", level: 2,
    title: "Use the difference of two squares", summary: "Look for two factors equally far from the same multiple of ten.",
    when: "The factors sit on opposite sides of the same base, at equal distances, as in 48 × 52 or 97 × 103.",
    rule: "(B − d) × (B + d) = B² − d². Square the base, then subtract the square of the distance.",
    memory: "Remember just the base B and the distance d. For 48 × 52, these are 50 and 2.",
    pitfall: "The distances must match. You cannot calculate 48 × 53 directly as 50² − 2².",
    example: { expression: "48 × 52", answer: "2496", steps: [
      step("Square the base", "50 × 50", "2500", "48 = 50 − 2 and 52 = 50 + 2."),
      step("Square the distance", "2 × 2", "4", "The distance is 2, whose square is 4."),
      step("Subtract", "2500 − 4", "2496", "The two cross terms cancel, leaving the difference of two squares.")
    ] },
    guided: { expression: "97 × 103", answer: "9991", steps: [
      step("Use the common base of 100", "100 × 100", "10000", "Both factors are 3 away from 100."),
      step("Square the distance of 3", "3 × 3", "9", "Subtract the square, 9, rather than the distance, 3."),
      step("Finish the difference of squares", "10000 − 9", "9991", "The product is 9 less than ten thousand.")
    ] },
    drills: [drill("38 × 42", "1596", "40² − 2² = 1,600 − 4 = 1,596."), drill("94 × 106", "9964", "100² − 6² = 10,000 − 36 = 9,964."), drill("67 × 73", "4891", "70² − 3² = 4,900 − 9 = 4,891.")]
  },
  {
    id: "addition-compensate", category: "addition", level: 2,
    title: "Round and adjust in addition", summary: "Round a number to a nearby hundred, then subtract the extra amount.",
    when: "One of the numbers is close to a multiple of ten or hundred, such as 398, 199 or 997.",
    rule: "Replacing a with a + d adds an extra d. Subtract d at the end to keep the sum unchanged.",
    memory: "Keep the rounded sum and one small adjustment in mind.",
    pitfall: "If you round up, subtract the adjustment. If you round down, add it. Adjusting in the wrong direction doubles the error.",
    example: { expression: "398 + 257", answer: "655", steps: [
      step("Round 398 up to 400", "400 + 257", "657", "This adds 2 more than the original problem."),
      step("Subtract the extra 2", "657 − 2", "655", "Undo the extra amount added by rounding.")
    ] },
    guided: { expression: "697 + 486", answer: "1183", steps: [
      step("Round 697 up to 700", "700 + 486", "1186", "Adding a multiple of a hundred keeps the first step simple."),
      step("Subtract the extra 3", "1186 − 3", "1183", "The original number was 3 less than 700.")
    ] },
    drills: [drill("299 + 458", "757", "300 + 458 − 1 = 757."), drill("586 + 199", "785", "586 + 200 − 1 = 785."), drill("997 + 648", "1645", "1,000 + 648 − 3 = 1,645.")]
  },
  {
    id: "subtraction-compensate", category: "subtraction", level: 2,
    title: "Round or count up in subtraction", summary: "If you subtract too much, add the extra amount back.",
    when: "The number being subtracted is close to a multiple of a hundred, or it is easy to count up from the smaller number to the larger one.",
    rule: "a − (B − d) = a − B + d. Alternatively, count up from the number being subtracted to the starting number, then add the jumps.",
    memory: "For 702 − 398, calculate 702 − 400 to get 302, then add back 2.",
    pitfall: "Rounding the number being subtracted up means you must add the adjustment back at the end.",
    example: { expression: "702 − 398", answer: "304", steps: [
      step("Subtract 400 first", "702 − 400", "302", "You have temporarily subtracted 2 too much."),
      step("Add 2 back", "302 + 2", "304", "You can also count up: 398 → 400 adds 2, and 400 → 702 adds 302, for a total difference of 304.")
    ] },
    guided: { expression: "1003 − 687", answer: "316", steps: [
      step("Round 687 up to 700 and subtract", "1003 − 700", "303", "You have subtracted 13 too much."),
      step("Add 13 back", "303 + 13", "316", "It takes 13 to go from 687 to 700, then 303 to reach 1,003.")
    ] },
    drills: [drill("801 − 497", "304", "801 − 500 + 3 = 304."), drill("1204 − 798", "406", "1,204 − 800 + 2 = 406."), drill("603 − 289", "314", "603 − 300 + 11 = 314.")]
  },
  {
    id: "factor-division", category: "division", level: 2,
    title: "Split the divisor into factors", summary: "Turn one difficult division into two familiar divisions.",
    when: "The divisor can be written as a product of convenient factors, such as 24 = 6 × 4 or 18 = 9 × 2.",
    rule: "a ÷ (b × c) = (a ÷ b) ÷ c. Choose the order that makes the intermediate result easier to handle.",
    memory: "Keep just the current quotient in mind: 936 → 156 → 39.",
    pitfall: "Split the divisor into a product, not a sum. Dividing by 24 is not the same as dividing by 20 and then by 4.",
    example: { expression: "936 ÷ 24", answer: "39", steps: [
      step("Use 24 = 6 × 4 and divide by 6 first", "936 ÷ 6", "156", "900 ÷ 6 = 150 and 36 ÷ 6 = 6."),
      step("Divide by 4", "156 ÷ 4", "39", "Halve once to get 78, then halve again to get 39.")
    ] },
    guided: { expression: "864 ÷ 18", answer: "48", steps: [
      step("Use 18 = 9 × 2 and divide by 9 first", "864 ÷ 9", "96", "810 ÷ 9 = 90 and 54 ÷ 9 = 6."),
      step("Divide by 2", "96 ÷ 2", "48", "Check with 48 × 18 = 864.")
    ] },
    drills: [drill("672 ÷ 16", "42", "16 = 4 × 4. First, 672 ÷ 4 = 168; divide by 4 again to get 42."), drill("1260 ÷ 35", "36", "35 = 5 × 7. First, 1,260 ÷ 5 = 252; divide by 7 to get 36."), drill("1056 ÷ 24", "44", "24 = 6 × 4. First, 1,056 ÷ 6 = 176; divide by 4 to get 44.")]
  },
  {
    id: "percentage-blocks", category: "percentages", level: 2,
    title: "Build percentages from simple parts", summary: "Use 10%, 5%, 1% and familiar fractions as building blocks.",
    when: "A percentage such as 15%, 17.5%, 35% or 125% can be split into a few simple percentages.",
    rule: "Find 10% by dividing by 10. Halve that to get 5%, then halve again for 2.5%. Also, 25% = 1/4 and 12.5% = 1/8.",
    memory: "Find 10% as a starting point, then derive the other parts from it wherever possible.",
    pitfall: "17.5% = 10% + 5% + 2.5%. Each percentage refers to the original number. Check that your answer is a sensible fraction of that number.",
    example: { expression: "17.5% of 240", answer: "42", steps: [
      step("Find 10% first", "240 ÷ 10", "24", "Move the decimal point one place to the left."),
      step("Halve to get 5%", "24 ÷ 2", "12", "5% is half of 10%."),
      step("Halve again to get 2.5%", "12 ÷ 2", "6", "The three parts are now 24, 12 and 6."),
      step("Add the three parts", "24 + 12 + 6", "42", "The answer is roughly one fifth of 240, so its size is reasonable.")
    ] },
    guided: { expression: "35% of 360", answer: "126", steps: [
      step("Find 10% first", "360 ÷ 10", "36", "Split 35% into 30% + 5%."),
      step("Triple 10% to get 30%", "36 × 3", "108", "Keep the larger part, 108, in mind."),
      step("Halve 10% to get 5%", "36 ÷ 2", "18", "This gives the remaining 5%."),
      step("Add the parts", "108 + 18", "126", "30% + 5% = 35%.")
    ] },
    drills: [drill("15% of 280", "42", "10% is 28 and 5% is 14, giving a total of 42."), drill("12.5% of 320", "40", "12.5% = 1/8, so 320 ÷ 8 = 40."), drill("125% of 240", "300", "125% = 100% + 25%, so 240 + 60 = 300.")]
  },
  {
    id: "common-denominator", category: "fractions", level: 2,
    title: "Fractions: use the same-sized parts", summary: "Find a common denominator, add the numerators, then simplify.",
    when: "You add or subtract fractions with different denominators, or convert between fractions and decimals.",
    rule: "The denominator tells you the size of each part. Rewrite 3/4 and 5/8 in eighths before adding them. Multiplying the numerator and denominator by the same nonzero number keeps the value unchanged.",
    memory: "Look for a small common denominator. If one denominator is a multiple of the other, use the larger one.",
    pitfall: "Do not add the denominators along with the numerators. Keep recurring decimals as exact fractions rather than rounding them.",
    example: { expression: "3/4 + 5/8", answer: "11/8", steps: [
      step("Rewrite three quarters in eighths: find the new numerator", "3 × 2", "6", "4 × 2 = 8, so 3/4 = 6/8."),
      step("Add parts of the same size", "6/8 + 5/8", "11/8", "6 eighths plus 5 eighths make 11 eighths. You can also enter the answer as 1.375.")
    ] },
    guided: { expression: "2/3 + 1/4", answer: "11/12", steps: [
      step("Use denominator 12 and find the first numerator", "2 × 4", "8", "3 × 4 = 12, so 2/3 = 8/12."),
      step("Find the second numerator", "1 × 3", "3", "4 × 3 = 12, so 1/4 = 3/12."),
      step("Add the fractions", "8/12 + 3/12", "11/12", "Enter 11/12 to keep the answer exact instead of using an approximate decimal.")
    ] },
    drills: [drill("3/5 + 1/4", "17/20", "3/5 = 12/20 and 1/4 = 5/20, which add to 17/20."), drill("7/8 + 3/4", "13/8", "3/4 = 6/8, so 7/8 + 6/8 = 13/8."), drill("1/6 + 5/12", "7/12", "1/6 = 2/12; add 5/12 to get 7/12.")]
  },
  {
    id: "decimal-products", category: "decimals", level: 2,
    title: "Decimal multiplication: choose a convenient base", summary: "Start with an easy factor such as 25 or 50, then make a small adjustment.",
    when: "A decimal factor is close to a convenient number, as in 28.5 × 24.7. In other cases, you can convert to whole-number multiplication first.",
    rule: "24.7 = 25 − 0.3, so multiply by 25, then subtract the product with 0.3. A general alternative is to multiply as whole numbers, then scale back by the total number of decimal places in both factors.",
    memory: "Keep the main result, 712.5, in mind and subtract 8.55 in two stages: subtract 8, then 0.55.",
    pitfall: "28.5 × 0.3 = 8.55, not 85.5. Estimate first: 28.5 × 24.7 is a little less than 30 × 25 = 750.",
    example: { expression: "28.5 × 24.7", answer: "703.95", steps: [
      step("Find the main product with 25", "28.5 × 25", "712.5", "25 = 100 ÷ 4, so 28.5 × 100 ÷ 4 = 2,850 ÷ 4."),
      step("Find the extra product with 0.3", "28.5 × 0.3", "8.55", "Multiply by 3 to get 85.5, then divide by 10."),
      step("Subtract the adjustment", "712.5 − 8.55", "703.95", "712.5 − 8 = 704.5, then subtract 0.55.")
    ] },
    guided: { expression: "16.8 × 19.5", answer: "327.6", steps: [
      step("Round 19.5 up to 20", "16.8 × 20", "336", "Multiply by 2, then by 10."),
      step("Find the extra product with 0.5", "16.8 × 0.5", "8.4", "Multiplying by 0.5 means taking half."),
      step("Subtract the extra amount", "336 − 8.4", "327.6", "The answer should be a little less than 336.")
    ] },
    drills: [drill("12.4 × 24.5", "303.8", "12.4 × (25 − 0.5) = 310 − 6.2 = 303.8."), drill("32.6 × 9.8", "319.48", "32.6 × (10 − 0.2) = 326 − 6.52 = 319.48."), drill("18.5 × 4.75", "87.875", "18.5 × (5 − 0.25) = 92.5 − 4.625 = 87.875.")]
  },
  {
    id: "decimal-division", category: "decimal_division", level: 2,
    title: "Decimal division: scale both numbers together", summary: "Make the divisor a whole number without changing the quotient.",
    when: "The divisor has a decimal point, as in ÷2.4, ÷1.5 or ÷0.25.",
    rule: "Multiplying the dividend and divisor by the same nonzero number leaves the quotient unchanged. If the divisor has one decimal place, multiply both numbers by 10.",
    memory: "Rewrite the whole calculation before dividing. Finish moving both decimal points before doing the arithmetic.",
    pitfall: "Move the decimal point in both numbers, not just the divisor. For positive numbers, dividing by a number less than 1 makes the result larger; use this to check its size.",
    example: { expression: "84.24 ÷ 2.4", answer: "35.1", steps: [
      step("Multiply both by 10: find the new dividend", "84.24 × 10", "842.4", "The new divisor is 24, so the calculation becomes 842.4 ÷ 24."),
      step("Find the whole-number part", "24 × 35", "840", "35 lots of 24 account for 840."),
      step("Find the amount left over", "842.4 − 840", "2.4", "There is 2.4 left, which still needs to be divided by 24."),
      step("Find the decimal part", "2.4 ÷ 24", "0.1", "The final answer is 35 + 0.1 = 35.1.")
    ] },
    guided: { expression: "67.2 ÷ 1.6", answer: "42", steps: [
      step("Multiply both by 10 and find the new dividend", "67.2 × 10", "672", "At the same time, the divisor changes from 1.6 to 16."),
      step("Use 16 = 4 × 4 and divide once", "672 ÷ 4", "168", "Now you only need to work with whole numbers."),
      step("Divide by 4 again", "168 ÷ 4", "42", "Check: 42 × 1.6 = 67.2.")
    ] },
    drills: [drill("57.6 ÷ 1.2", "48", "Multiply both numbers by 10 to get 576 ÷ 12 = 48."), drill("43.2 ÷ 1.5", "28.8", "Multiply both by 10: 432 ÷ 15 = 864 ÷ 30 = 28.8."), drill("7.5 ÷ 0.25", "30", "Dividing by a quarter is multiplying by 4: 7.5 × 4 = 30.")]
  }
];
