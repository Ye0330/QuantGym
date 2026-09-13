import type { Lesson } from "./quant-lessons.ts";

export const MULTIPLICATION_LESSONS: Lesson[] = [
  {
    "id": "triple-single",
    "category": "multiplication",
    "level": 1,
    "title": "Stage 1: Three digits × one digit",
    "summary": "Split the number into hundreds, tens, and ones. Update one running total after each part.",
    "when": "Start here once single-digit multiplication feels comfortable. Multiplying a three-digit number by one digit is the foundation for the next three stages.",
    "rule": "237 × 6 = 200 × 6 + 30 × 6 + 7 × 6. Work from the largest place value down. Split each product into easy amounts before adding it to your total.",
    "memory": "Keep only the running total and the part you are working on in mind. When an addition crosses a ten or a hundred, reach that round number first, then add the rest. Write down the total at first if it helps; work mentally as the steps become familiar.",
    "pitfall": "30 × 6 is 180: keep the zero that represents the tens. When a sum crosses a hundred, update the hundreds digit too, rather than just the last two digits.",
    "example": {
      "expression": "237 × 6",
      "answer": "1422",
      "steps": [
        {
          "title": "Start with the hundreds",
          "calculation": "200 × 6",
          "answer": "1200",
          "explanation": "237 = 200 + 30 + 7. Set your running total to 1,200."
        },
        {
          "title": "Multiply the tens",
          "calculation": "30 × 6",
          "answer": "180",
          "explanation": "3 × 6 = 18. These are 3 tens, so the product is 180."
        },
        {
          "title": "Add the first 100",
          "calculation": "1200 + 100",
          "answer": "1300",
          "explanation": "Split 180 into 100 + 80. Add 100 to update your total."
        },
        {
          "title": "Add the remaining 80",
          "calculation": "1300 + 80",
          "answer": "1380",
          "explanation": "The hundreds and tens are now included. Your total is 1,380."
        },
        {
          "title": "Multiply the ones",
          "calculation": "7 × 6",
          "answer": "42",
          "explanation": "Split 42 into 40 + 2, ready to add to your total."
        },
        {
          "title": "Add 40 across the next hundred",
          "calculation": "1380 + 40",
          "answer": "1420",
          "explanation": "80 + 40 = 120, so carry 1 into the hundreds. You can add 20 to reach 1,400, then another 20."
        },
        {
          "title": "Add the final 2",
          "calculation": "1420 + 2",
          "answer": "1422",
          "explanation": "Update your total to 1,422. This is the answer to the whole problem."
        }
      ]
    },
    "guided": {
      "expression": "286 × 4",
      "answer": "1144",
      "steps": [
        {
          "title": "Start with the hundreds",
          "calculation": "200 × 4",
          "answer": "800",
          "explanation": "286 = 200 + 80 + 6. Set your running total to 800."
        },
        {
          "title": "Multiply the tens",
          "calculation": "80 × 4",
          "answer": "320",
          "explanation": "8 × 4 = 32, then multiply by 10. Split the result into 300 + 20."
        },
        {
          "title": "Add 300 across the next thousand",
          "calculation": "800 + 300",
          "answer": "1100",
          "explanation": "Add 200 to reach 1,000, then add the remaining 100."
        },
        {
          "title": "Add the remaining 20",
          "calculation": "1100 + 20",
          "answer": "1120",
          "explanation": "Update your running total to 1,120."
        },
        {
          "title": "Multiply the ones",
          "calculation": "6 × 4",
          "answer": "24",
          "explanation": "Split 24 into 20 + 4."
        },
        {
          "title": "Add 20 first",
          "calculation": "1120 + 20",
          "answer": "1140",
          "explanation": "Update your total with one small amount at a time."
        },
        {
          "title": "Then add 4",
          "calculation": "1140 + 4",
          "answer": "1144",
          "explanation": "The hundreds, tens, and ones are all included. Your answer is 1,144."
        }
      ]
    },
    "drills": [
      {
        "expression": "123 × 4",
        "answer": "492",
        "explanation": "Start with 400. Add 80 to get 480, then add 12 to get 492."
      },
      {
        "expression": "248 × 3",
        "answer": "744",
        "explanation": "600 + 120 = 720. The ones give 8 × 3 = 24. Add in steps: 720 → 740 → 744."
      },
      {
        "expression": "367 × 7",
        "answer": "2569",
        "explanation": "Start with 2,100. Add 420 in steps: 2,500 → 2,520. Then add 49: 2,560 → 2,569."
      }
    ],
    "multiplicationStage": "triple-single"
  },
  {
    "id": "triple-double",
    "category": "multiplication",
    "level": 2,
    "title": "Stage 2: Three digits × two digits",
    "summary": "Split the two-digit multiplier into tens and ones. Add one part at a time.",
    "when": "Move to this stage when three digits × one digit feels reliable. You will use that same skill twice, with a two-digit multiplier.",
    "rule": "237 × 46 = 237 × 40 + 237 × 6. To multiply by 40, multiply by 4 and then by 10. Once you have the ones product, add it to the main total in small steps.",
    "memory": "Keep the tens product as your running total while you work out the ones product. To add 1,422, update the total with +1,000, +400, +20, and +2. You do not need to do the large addition in one step.",
    "pitfall": "Multiplying by 40 requires a further × 10 after multiplying by 4. When combining products, respect place value: the 4 in 1,422 means 400.",
    "example": {
      "expression": "237 × 46",
      "answer": "10902",
      "steps": [
        {
          "title": "40 = 4 × 10: multiply by 4 first",
          "calculation": "237 × 4",
          "answer": "948",
          "explanation": "Use Stage 1: 800 + 120 + 28 = 948."
        },
        {
          "title": "Multiply by 10 to set the total",
          "calculation": "948 × 10",
          "answer": "9480",
          "explanation": "This is 237 × 40. Set your running total to 9,480."
        },
        {
          "title": "Multiply by the remaining 6",
          "calculation": "237 × 6",
          "answer": "1422",
          "explanation": "Use the method from the Stage 1 example. Split the result into 1,000 + 400 + 20 + 2."
        },
        {
          "title": "Add 1,000 first",
          "calculation": "9480 + 1000",
          "answer": "10480",
          "explanation": "The total passes ten thousand. Update it to 10,480."
        },
        {
          "title": "Then add 400",
          "calculation": "10480 + 400",
          "answer": "10880",
          "explanation": "Your total is now 10,880. There is still 22 to add from the ones product."
        },
        {
          "title": "Add 20 to reach the next hundred",
          "calculation": "10880 + 20",
          "answer": "10900",
          "explanation": "80 + 20 = 100, so carry 1 into the hundreds."
        },
        {
          "title": "Add the final 2",
          "calculation": "10900 + 2",
          "answer": "10902",
          "explanation": "You have now added all of 1,422. The answer is 10,902."
        }
      ]
    },
    "guided": {
      "expression": "286 × 34",
      "answer": "9724",
      "steps": [
        {
          "title": "Multiply by the tens digit, 3",
          "calculation": "286 × 3",
          "answer": "858",
          "explanation": "600 + 240 + 18 = 858. The next step restores the tens place value."
        },
        {
          "title": "Multiply by 10 for the tens",
          "calculation": "858 × 10",
          "answer": "8580",
          "explanation": "286 × 30 = 8,580. Use this as your running total."
        },
        {
          "title": "Multiply by the ones digit, 4",
          "calculation": "286 × 4",
          "answer": "1144",
          "explanation": "This is the Stage 1 guided problem. Split the result into 1,000 + 100 + 40 + 4."
        },
        {
          "title": "Add 1,000",
          "calculation": "8580 + 1000",
          "answer": "9580",
          "explanation": "Update your total to 9,580."
        },
        {
          "title": "Add 100",
          "calculation": "9580 + 100",
          "answer": "9680",
          "explanation": "Update your total to 9,680."
        },
        {
          "title": "Add 40 across the next hundred",
          "calculation": "9680 + 40",
          "answer": "9720",
          "explanation": "Add 20 to reach 9,700, then another 20. The hundreds digit changes from 6 to 7."
        },
        {
          "title": "Add the final 4",
          "calculation": "9720 + 4",
          "answer": "9724",
          "explanation": "Both products are now included. The answer is 9,724."
        }
      ]
    },
    "drills": [
      {
        "expression": "123 × 24",
        "answer": "2952",
        "explanation": "Start with 123 × 20 = 2,460. The ones product is 492. Add in steps: 2,860 → 2,950 → 2,952."
      },
      {
        "expression": "248 × 36",
        "answer": "8928",
        "explanation": "Start with the tens product, 7,440. The ones product is 1,488. Add in steps: 8,440 → 8,840 → 8,920 → 8,928."
      },
      {
        "expression": "367 × 47",
        "answer": "17249",
        "explanation": "Start with the tens product, 14,680. The ones product is 2,569. Add in steps: 16,680 → 17,180 → 17,240 → 17,249."
      }
    ],
    "multiplicationStage": "triple-double"
  },
  {
    "id": "triple-near-hundred",
    "category": "multiplication",
    "level": 3,
    "title": "Stage 3: Multiply near a round hundred",
    "summary": "Multiply by a nearby round hundred, then add or subtract the adjustment in small steps.",
    "when": "Use this when both factors have three digits and one is close to a round hundred such as 200, 300, or 400. Examples include 298 and 203.",
    "rule": "237 × 298 = 237 × 300 − 237 × 2. To multiply by 300, multiply by 3 and then by 100. Since 298 is 2 less than 300, subtract two lots of 237.",
    "memory": "Keep the round-hundred product as your running total, then work out the adjustment. Split 474 into 400, 70, and 4 and subtract one amount at a time. If the original multiplier is above the round hundred, add the adjustment instead.",
    "pitfall": "The adjustment is the other factor multiplied by the difference: you cannot just subtract 2. Rounding 298 up to 300 means subtracting afterwards; using 200 for 203 means adding afterwards.",
    "example": {
      "expression": "237 × 298",
      "answer": "70626",
      "steps": [
        {
          "title": "298 = 300 − 2: multiply by 3 first",
          "calculation": "237 × 3",
          "answer": "711",
          "explanation": "600 + 90 + 21 = 711. Next, restore the hundreds place value."
        },
        {
          "title": "Multiply by 100 to set the total",
          "calculation": "711 × 100",
          "answer": "71100",
          "explanation": "237 × 300 = 71,100. Use this as your running total."
        },
        {
          "title": "Find the two extra lots",
          "calculation": "237 × 2",
          "answer": "474",
          "explanation": "Subtract 474, split into 400 + 70 + 4."
        },
        {
          "title": "Subtract 400 first",
          "calculation": "71100 − 400",
          "answer": "70700",
          "explanation": "Subtract 100 to reach 71,000, then subtract another 300 to get 70,700. Take care as you cross the thousand."
        },
        {
          "title": "Then subtract 70",
          "calculation": "70700 − 70",
          "answer": "70630",
          "explanation": "Think of 700 − 70 = 630, keeping the leading 70,000."
        },
        {
          "title": "Subtract the final 4",
          "calculation": "70630 − 4",
          "answer": "70626",
          "explanation": "30 − 4 = 26, so your total is 70,626."
        }
      ]
    },
    "guided": {
      "expression": "364 × 203",
      "answer": "73892",
      "steps": [
        {
          "title": "203 = 200 + 3: multiply by 2 first",
          "calculation": "364 × 2",
          "answer": "728",
          "explanation": "The multiplier is 3 above the round hundred, so you will add three lots of 364 afterwards."
        },
        {
          "title": "Multiply by 100 for the hundreds",
          "calculation": "728 × 100",
          "answer": "72800",
          "explanation": "Set your running total to 72,800."
        },
        {
          "title": "Find the three missing lots",
          "calculation": "364 × 3",
          "answer": "1092",
          "explanation": "900 + 180 + 12 = 1,092. Split this into 1,000 + 90 + 2."
        },
        {
          "title": "Add 1,000",
          "calculation": "72800 + 1000",
          "answer": "73800",
          "explanation": "Update your total to 73,800."
        },
        {
          "title": "Then add 90",
          "calculation": "73800 + 90",
          "answer": "73890",
          "explanation": "The hundreds digit of 1,092 is 0. There is no 100 to add."
        },
        {
          "title": "Add the final 2",
          "calculation": "73890 + 2",
          "answer": "73892",
          "explanation": "The adjustment is complete. Your answer is 73,892, which should be slightly above 72,800."
        }
      ]
    },
    "drills": [
      {
        "expression": "426 × 198",
        "answer": "84348",
        "explanation": "426 × 200 = 85,200. Subtract the adjustment, 852, in steps: 84,400 → 84,350 → 84,348."
      },
      {
        "expression": "318 × 402",
        "answer": "127836",
        "explanation": "318 × 400 = 127,200. Add 636 in steps: 127,800 → 127,830 → 127,836."
      },
      {
        "expression": "247 × 597",
        "answer": "147459",
        "explanation": "247 × 600 = 148,200. Subtract 247 × 3 = 741 in steps: 147,500 → 147,460 → 147,459."
      }
    ],
    "multiplicationStage": "triple-near-hundred"
  },
  {
    "id": "triple-general",
    "category": "multiplication",
    "level": 3,
    "title": "Stage 4: Any three digits × three digits",
    "summary": "Split the multiplier into hundreds, tens, and ones. Add each product to your total as soon as it is ready.",
    "when": "Use this general method once the first three stages feel reliable, especially when neither factor is close to a useful round number. Build accuracy before speed.",
    "rule": "237 × 346 = 237 × 300 + 237 × 40 + 237 × 6. Start with the hundreds product. Work out the tens product and add it immediately. Only then work out and add the ones product.",
    "memory": "Keep one running total and the current part: 71,100 → 80,580 → 82,002. Break each large addition into thousands, hundreds, tens, and ones. You do not need to hold all three products in mind at once.",
    "pitfall": "After multiplying by the hundreds digit, multiply by 100; after multiplying by the tens digit, multiply by 10. Replace the old total with the new one after each addition. Do not return to the old total or add a completed part again.",
    "example": {
      "expression": "237 × 346",
      "answer": "82002",
      "steps": [
        {
          "title": "Split off 300: multiply by 3 first",
          "calculation": "237 × 3",
          "answer": "711",
          "explanation": "346 = 300 + 40 + 6. Start with the hundreds product."
        },
        {
          "title": "Multiply by 100 to set the first total",
          "calculation": "711 × 100",
          "answer": "71100",
          "explanation": "The hundreds product is 71,100. Use it as your starting total."
        },
        {
          "title": "Start the tens: multiply by 4",
          "calculation": "237 × 4",
          "answer": "948",
          "explanation": "Keep the total at 71,100 while you work on 237 × 40."
        },
        {
          "title": "Multiply by 10 for the tens product",
          "calculation": "948 × 10",
          "answer": "9480",
          "explanation": "Split 9,480 into 9,000 + 400 + 80 and start adding it to your total."
        },
        {
          "title": "Add the first 9,000",
          "calculation": "71100 + 9000",
          "answer": "80100",
          "explanation": "The total passes eighty thousand. Update it to 80,100."
        },
        {
          "title": "Then add 400",
          "calculation": "80100 + 400",
          "answer": "80500",
          "explanation": "Update your total to 80,500."
        },
        {
          "title": "Add 80 to finish the tens product",
          "calculation": "80500 + 80",
          "answer": "80580",
          "explanation": "Keep only the new total, 80,580. The hundreds and tens products are both included."
        },
        {
          "title": "Now find the ones product",
          "calculation": "237 × 6",
          "answer": "1422",
          "explanation": "Split 1,422 into 1,000 + 400 + 20 + 2."
        },
        {
          "title": "Add the first 1,000",
          "calculation": "80580 + 1000",
          "answer": "81580",
          "explanation": "Update your total to 81,580."
        },
        {
          "title": "Then add 400",
          "calculation": "81580 + 400",
          "answer": "81980",
          "explanation": "Update your total to 81,980. There is still 22 to add."
        },
        {
          "title": "Add 20 to reach the next thousand",
          "calculation": "81980 + 20",
          "answer": "82000",
          "explanation": "980 + 20 = 1,000. Carry 1 into the thousands to get 82,000."
        },
        {
          "title": "Add the final 2",
          "calculation": "82000 + 2",
          "answer": "82002",
          "explanation": "All three products are included. Your final answer is 82,002."
        }
      ]
    },
    "guided": {
      "expression": "286 × 347",
      "answer": "99242",
      "steps": [
        {
          "title": "Start the hundreds: multiply by 3",
          "calculation": "286 × 3",
          "answer": "858",
          "explanation": "347 = 300 + 40 + 7. Begin with the hundreds product."
        },
        {
          "title": "Multiply by 100 to set the total",
          "calculation": "858 × 100",
          "answer": "85800",
          "explanation": "Set your running total to 85,800."
        },
        {
          "title": "Start the tens: multiply by 4",
          "calculation": "286 × 4",
          "answer": "1144",
          "explanation": "Use the three-digit × one-digit skill you practised in Stage 1."
        },
        {
          "title": "Multiply by 10 for the tens product",
          "calculation": "1144 × 10",
          "answer": "11440",
          "explanation": "Split 11,440 into 10,000 + 1,000 + 400 + 40."
        },
        {
          "title": "Add 10,000 first",
          "calculation": "85800 + 10000",
          "answer": "95800",
          "explanation": "Update your total to 95,800."
        },
        {
          "title": "Then add 1,000",
          "calculation": "95800 + 1000",
          "answer": "96800",
          "explanation": "Update your total to 96,800."
        },
        {
          "title": "Add 400 across the next thousand",
          "calculation": "96800 + 400",
          "answer": "97200",
          "explanation": "Add 200 to reach 97,000, then another 200 to get 97,200."
        },
        {
          "title": "Add 40 to finish the tens product",
          "calculation": "97200 + 40",
          "answer": "97240",
          "explanation": "Keep the updated total, 97,240. Now you can start the ones product."
        },
        {
          "title": "Find the ones product",
          "calculation": "286 × 7",
          "answer": "2002",
          "explanation": "1,400 + 560 + 42 = 2,002. You only need to add 2,000 and 2."
        },
        {
          "title": "Add 2,000",
          "calculation": "97240 + 2000",
          "answer": "99240",
          "explanation": "Update your total to 99,240."
        },
        {
          "title": "Add the final 2",
          "calculation": "99240 + 2",
          "answer": "99242",
          "explanation": "All parts are complete. The answer is 99,242."
        }
      ]
    },
    "drills": [
      {
        "expression": "123 × 234",
        "answer": "28782",
        "explanation": "Start with 24,600. Add the tens product, 3,690: 27,600 → 28,200 → 28,290. Then add the ones product, 492: 28,690 → 28,780 → 28,782."
      },
      {
        "expression": "248 × 367",
        "answer": "91016",
        "explanation": "Start with 74,400. Add the tens product, 14,880: 84,400 → 88,400 → 89,200 → 89,280. Then add the ones product, 1,736: 90,280 → 90,980 → 91,010 → 91,016."
      },
      {
        "expression": "367 × 458",
        "answer": "168086",
        "explanation": "Start with 146,800. Add the tens product, 18,350: 156,800 → 164,800 → 165,100 → 165,150. Then add the ones product, 2,936: 167,150 → 168,050 → 168,080 → 168,086."
      }
    ],
    "multiplicationStage": "triple-general"
  }
];
