import type { Lesson } from "./quant-lessons.ts";

export const MULTIPLICATION_LESSONS: Lesson[] = [
  {
    "id": "triple-single",
    "category": "multiplication",
    "level": 1,
    "title": "第 1 阶：三位数 × 一位数",
    "summary": "按百、十、个拆开；每算完一块，就更新总数。",
    "when": "先会个位数乘法，再练三位数乘一个个位数。这是后面三个台阶的基础。",
    "rule": "237 × 6 = 200 × 6 + 30 × 6 + 7 × 6。先算高位，把后面的结果分成整百、整十和个位，逐块加入。",
    "memory": "脑中保留一个累计总数和正在处理的一块。遇到进位，先凑到下一个整十或整百，再继续。练习时可以先写下总数，熟悉后再口算。",
    "pitfall": "30 × 6 是 180，不能漏掉十位的零。总数跨过整百时，百位也要更新；不要只改最后两位。",
    "example": {
      "expression": "237 × 6",
      "answer": "1422",
      "steps": [
        {
          "title": "先算百位",
          "calculation": "200 × 6",
          "answer": "1200",
          "explanation": "237 = 200 + 30 + 7。先把总数记为 1,200。"
        },
        {
          "title": "算十位这一块",
          "calculation": "30 × 6",
          "answer": "180",
          "explanation": "3 × 6 = 18；原来是 3 个十，所以得到 180。"
        },
        {
          "title": "十位块先加 100",
          "calculation": "1200 + 100",
          "answer": "1300",
          "explanation": "把 180 拆成 100 + 80，先更新总数。"
        },
        {
          "title": "再加余下的 80",
          "calculation": "1300 + 80",
          "answer": "1380",
          "explanation": "现在百位和十位都算完了，总数是 1,380。"
        },
        {
          "title": "算个位这一块",
          "calculation": "7 × 6",
          "answer": "42",
          "explanation": "把 42 拆成 40 + 2，再往总数里加。"
        },
        {
          "title": "加 40，处理进位",
          "calculation": "1380 + 40",
          "answer": "1420",
          "explanation": "80 + 40 = 120，要向百位进 1。也可以先加 20 到 1,400，再加 20。"
        },
        {
          "title": "补上最后的 2",
          "calculation": "1420 + 2",
          "answer": "1422",
          "explanation": "总数更新为 1,422，这就是整题答案。"
        }
      ]
    },
    "guided": {
      "expression": "286 × 4",
      "answer": "1144",
      "steps": [
        {
          "title": "先算百位",
          "calculation": "200 × 4",
          "answer": "800",
          "explanation": "286 = 200 + 80 + 6。把总数记为 800。"
        },
        {
          "title": "算十位这一块",
          "calculation": "80 × 4",
          "answer": "320",
          "explanation": "8 × 4 = 32，再乘 10。把这一块拆成 300 + 20。"
        },
        {
          "title": "加整百，跨过一千",
          "calculation": "800 + 300",
          "answer": "1100",
          "explanation": "800 加 200 到 1,000，再加剩下的 100。"
        },
        {
          "title": "补上 20",
          "calculation": "1100 + 20",
          "answer": "1120",
          "explanation": "当前总数更新为 1,120。"
        },
        {
          "title": "算个位这一块",
          "calculation": "6 × 4",
          "answer": "24",
          "explanation": "把 24 拆成 20 + 4。"
        },
        {
          "title": "先加 20",
          "calculation": "1120 + 20",
          "answer": "1140",
          "explanation": "一次只更新一个小部分。"
        },
        {
          "title": "再加 4",
          "calculation": "1140 + 4",
          "answer": "1144",
          "explanation": "百、十、个都已处理完，得到 1,144。"
        }
      ]
    },
    "drills": [
      {
        "expression": "123 × 4",
        "answer": "492",
        "explanation": "先算 400，再加 80 得 480，最后加 12 得 492。"
      },
      {
        "expression": "248 × 3",
        "answer": "744",
        "explanation": "600 + 120 = 720；8 × 3 = 24，720 → 740 → 744。"
      },
      {
        "expression": "367 × 7",
        "answer": "2569",
        "explanation": "先算 2,100；再加 420：2,500 → 2,520；最后加 49：2,560 → 2,569。"
      }
    ],
    "multiplicationStage": "triple-single"
  },
  {
    "id": "triple-double",
    "category": "multiplication",
    "level": 2,
    "title": "第 2 阶：三位数 × 两位数",
    "summary": "把两位数拆成整十和个位，每次只合并一块。",
    "when": "能稳稳算三位数 × 一位数后，再把乘数扩展到两位数。",
    "rule": "237 × 46 = 237 × 40 + 237 × 6。乘 40 时，先乘 4，再乘 10；个位块算好后，分小步加到主结果。",
    "memory": "先固定整十块的总数，再算个位块。加 1,422 时，按 +1,000、+400、+20、+2 更新总数，不用一次完成大加法。",
    "pitfall": "乘 40 不等于乘 4，要再乘 10。合并时按实际位值加，1,422 里的 4 表示 400。",
    "example": {
      "expression": "237 × 46",
      "answer": "10902",
      "steps": [
        {
          "title": "40 = 4 × 10，先乘 4",
          "calculation": "237 × 4",
          "answer": "948",
          "explanation": "沿用第 1 阶：800 + 120 + 28 = 948。"
        },
        {
          "title": "再乘 10，固定主结果",
          "calculation": "948 × 10",
          "answer": "9480",
          "explanation": "这一块对应 237 × 40，总数先记为 9,480。"
        },
        {
          "title": "算余下的个位块",
          "calculation": "237 × 6",
          "answer": "1422",
          "explanation": "这是第 1 阶例题的算法；把结果拆成 1,000 + 400 + 20 + 2。"
        },
        {
          "title": "先加 1,000",
          "calculation": "9480 + 1000",
          "answer": "10480",
          "explanation": "总数跨过一万，更新为 10,480。"
        },
        {
          "title": "再加 400",
          "calculation": "10480 + 400",
          "answer": "10880",
          "explanation": "总数更新为 10,880；个位块还剩 22。"
        },
        {
          "title": "加 20，凑到整百",
          "calculation": "10880 + 20",
          "answer": "10900",
          "explanation": "80 + 20 = 100，向百位进 1。"
        },
        {
          "title": "最后补 2",
          "calculation": "10900 + 2",
          "answer": "10902",
          "explanation": "已经把 1,422 全部加入，答案是 10,902。"
        }
      ]
    },
    "guided": {
      "expression": "286 × 34",
      "answer": "9724",
      "steps": [
        {
          "title": "先乘十位上的 3",
          "calculation": "286 × 3",
          "answer": "858",
          "explanation": "600 + 240 + 18 = 858；下一步恢复十位。"
        },
        {
          "title": "恢复十位，乘 10",
          "calculation": "858 × 10",
          "answer": "8580",
          "explanation": "286 × 30 = 8,580，把它作为累计总数。"
        },
        {
          "title": "算个位上的 4",
          "calculation": "286 × 4",
          "answer": "1144",
          "explanation": "这是第 1 阶跟练题。结果分成 1,000 + 100 + 40 + 4。"
        },
        {
          "title": "加 1,000",
          "calculation": "8580 + 1000",
          "answer": "9580",
          "explanation": "总数更新为 9,580。"
        },
        {
          "title": "加 100",
          "calculation": "9580 + 100",
          "answer": "9680",
          "explanation": "总数更新为 9,680。"
        },
        {
          "title": "加 40，处理进位",
          "calculation": "9680 + 40",
          "answer": "9720",
          "explanation": "先加 20 到 9,700，再加 20；百位从 6 更新为 7。"
        },
        {
          "title": "补上 4",
          "calculation": "9720 + 4",
          "answer": "9724",
          "explanation": "两块已经合并，得到 9,724。"
        }
      ]
    },
    "drills": [
      {
        "expression": "123 × 24",
        "answer": "2952",
        "explanation": "主结果 123 × 20 = 2,460；个位块是 492。逐步加：2,860 → 2,950 → 2,952。"
      },
      {
        "expression": "248 × 36",
        "answer": "8928",
        "explanation": "主结果是 7,440；个位块是 1,488。逐步加：8,440 → 8,840 → 8,920 → 8,928。"
      },
      {
        "expression": "367 × 47",
        "answer": "17249",
        "explanation": "主结果是 14,680；个位块是 2,569。逐步加：16,680 → 17,180 → 17,240 → 17,249。"
      }
    ],
    "multiplicationStage": "triple-double"
  },
  {
    "id": "triple-near-hundred",
    "category": "multiplication",
    "level": 3,
    "title": "第 3 阶：接近整百的三位数乘法",
    "summary": "先乘附近的整百数，再分小步加回或减去差额。",
    "when": "两个因数都是三位数，而且一个因数接近 200、300、400 等整百数，例如 298 或 203。",
    "rule": "237 × 298 = 237 × 300 − 237 × 2。乘 300 就是先乘 3，再乘 100；298 比 300 少 2，所以减去两份 237。",
    "memory": "先保存整百块的总数，再求修正量。把 474 分成 400、70、4，逐次减；如果原乘数比整百数大，就逐次加。",
    "pitfall": "修正量是另一个因数乘以差额，不能只减 2。298 凑成 300 后要减；203 凑成 200 后要加。",
    "example": {
      "expression": "237 × 298",
      "answer": "70626",
      "steps": [
        {
          "title": "298 = 300 − 2，先乘 3",
          "calculation": "237 × 3",
          "answer": "711",
          "explanation": "600 + 90 + 21 = 711；接着恢复百位。"
        },
        {
          "title": "再乘 100，得到主结果",
          "calculation": "711 × 100",
          "answer": "71100",
          "explanation": "237 × 300 = 71,100。把这个数作为累计总数。"
        },
        {
          "title": "求多算的两份",
          "calculation": "237 × 2",
          "answer": "474",
          "explanation": "要减去 474，拆成 400 + 70 + 4。"
        },
        {
          "title": "先减 400",
          "calculation": "71100 − 400",
          "answer": "70700",
          "explanation": "先减 100 到 71,000，再减 300 到 70,700；注意跨过整千时要退位。"
        },
        {
          "title": "再减 70",
          "calculation": "70700 − 70",
          "answer": "70630",
          "explanation": "可以想 700 − 70 = 630，前面的 70,000 保留。"
        },
        {
          "title": "最后减 4",
          "calculation": "70630 − 4",
          "answer": "70626",
          "explanation": "30 − 4 = 26，所以总数是 70,626。"
        }
      ]
    },
    "guided": {
      "expression": "364 × 203",
      "answer": "73892",
      "steps": [
        {
          "title": "203 = 200 + 3，先乘 2",
          "calculation": "364 × 2",
          "answer": "728",
          "explanation": "这一题比整百数多 3，最后要加回三份 364。"
        },
        {
          "title": "恢复百位，乘 100",
          "calculation": "728 × 100",
          "answer": "72800",
          "explanation": "把 72,800 作为主结果。"
        },
        {
          "title": "算少算的三份",
          "calculation": "364 × 3",
          "answer": "1092",
          "explanation": "900 + 180 + 12 = 1,092，分成 1,000 + 90 + 2。"
        },
        {
          "title": "加回 1,000",
          "calculation": "72800 + 1000",
          "answer": "73800",
          "explanation": "总数更新为 73,800。"
        },
        {
          "title": "再加 90",
          "calculation": "73800 + 90",
          "answer": "73890",
          "explanation": "注意 1,092 的百位是 0，不需要加 100。"
        },
        {
          "title": "补上 2",
          "calculation": "73890 + 2",
          "answer": "73892",
          "explanation": "修正完毕，得到 73,892；它应略大于 72,800。"
        }
      ]
    },
    "drills": [
      {
        "expression": "426 × 198",
        "answer": "84348",
        "explanation": "426 × 200 = 85,200，修正量是 852。逐步减：84,400 → 84,350 → 84,348。"
      },
      {
        "expression": "318 × 402",
        "answer": "127836",
        "explanation": "318 × 400 = 127,200，再加 636。逐步加：127,800 → 127,830 → 127,836。"
      },
      {
        "expression": "247 × 597",
        "answer": "147459",
        "explanation": "247 × 600 = 148,200，减去 247 × 3 = 741。逐步减：147,500 → 147,460 → 147,459。"
      }
    ],
    "multiplicationStage": "triple-near-hundred"
  },
  {
    "id": "triple-general",
    "category": "multiplication",
    "level": 3,
    "title": "第 4 阶：一般三位数 × 三位数",
    "summary": "把乘数拆成百、十、个，算完一块就并入总数。",
    "when": "前面三阶能稳定完成后，用这条通用路线处理没有明显凑整机会的三位数乘法。先求稳，再提速。",
    "rule": "237 × 346 = 237 × 300 + 237 × 40 + 237 × 6。先固定百位块；算十位块并立即合并；最后再算个位块并合并。",
    "memory": "只保留一个累计总数和当前块：71,100 → 80,580 → 82,002。每次大加法继续拆成整千、整百、整十、个位，不同时记住三个乘积。",
    "pitfall": "百位块乘完要乘 100，十位块乘完要乘 10。合并后就用新总数替换旧总数；下一块不能加回旧总数，也不能重复加入上一块。",
    "example": {
      "expression": "237 × 346",
      "answer": "82002",
      "steps": [
        {
          "title": "拆出 300，先乘 3",
          "calculation": "237 × 3",
          "answer": "711",
          "explanation": "346 = 300 + 40 + 6。先处理百位块。"
        },
        {
          "title": "乘 100，固定第一个总数",
          "calculation": "711 × 100",
          "answer": "71100",
          "explanation": "百位块是 71,100；总数先记为它。"
        },
        {
          "title": "开始十位块，先乘 4",
          "calculation": "237 × 4",
          "answer": "948",
          "explanation": "总数仍是 71,100；当前只处理 237 × 40。"
        },
        {
          "title": "乘 10，得到十位块",
          "calculation": "948 × 10",
          "answer": "9480",
          "explanation": "把 9,480 分成 9,000 + 400 + 80，马上并入总数。"
        },
        {
          "title": "十位块先加 9,000",
          "calculation": "71100 + 9000",
          "answer": "80100",
          "explanation": "总数跨过八万，更新为 80,100。"
        },
        {
          "title": "再加 400",
          "calculation": "80100 + 400",
          "answer": "80500",
          "explanation": "总数更新为 80,500。"
        },
        {
          "title": "补上 80，十位块完成",
          "calculation": "80500 + 80",
          "answer": "80580",
          "explanation": "现在只记新总数 80,580；百位块和十位块都已算完。"
        },
        {
          "title": "最后算个位块",
          "calculation": "237 × 6",
          "answer": "1422",
          "explanation": "把 1,422 拆成 1,000 + 400 + 20 + 2。"
        },
        {
          "title": "个位块先加 1,000",
          "calculation": "80580 + 1000",
          "answer": "81580",
          "explanation": "总数更新为 81,580。"
        },
        {
          "title": "再加 400",
          "calculation": "81580 + 400",
          "answer": "81980",
          "explanation": "总数更新为 81,980，还差 22。"
        },
        {
          "title": "加 20，跨过整千",
          "calculation": "81980 + 20",
          "answer": "82000",
          "explanation": "980 + 20 = 1,000，向千位进 1，得到 82,000。"
        },
        {
          "title": "补上最后的 2",
          "calculation": "82000 + 2",
          "answer": "82002",
          "explanation": "三块都已合并，最终答案是 82,002。"
        }
      ]
    },
    "guided": {
      "expression": "286 × 347",
      "answer": "99242",
      "steps": [
        {
          "title": "百位块先乘 3",
          "calculation": "286 × 3",
          "answer": "858",
          "explanation": "347 = 300 + 40 + 7。先算百位块。"
        },
        {
          "title": "乘 100，设定总数",
          "calculation": "858 × 100",
          "answer": "85800",
          "explanation": "总数先记为 85,800。"
        },
        {
          "title": "十位块先乘 4",
          "calculation": "286 × 4",
          "answer": "1144",
          "explanation": "沿用第 1 阶练过的三位数 × 一位数。"
        },
        {
          "title": "乘 10，得到十位块",
          "calculation": "1144 × 10",
          "answer": "11440",
          "explanation": "把 11,440 拆成 10,000 + 1,000 + 400 + 40。"
        },
        {
          "title": "先加 10,000",
          "calculation": "85800 + 10000",
          "answer": "95800",
          "explanation": "总数更新为 95,800。"
        },
        {
          "title": "再加 1,000",
          "calculation": "95800 + 1000",
          "answer": "96800",
          "explanation": "总数更新为 96,800。"
        },
        {
          "title": "加 400，处理跨千进位",
          "calculation": "96800 + 400",
          "answer": "97200",
          "explanation": "先加 200 到 97,000，再加 200，得到 97,200。"
        },
        {
          "title": "补上 40，十位块完成",
          "calculation": "97200 + 40",
          "answer": "97240",
          "explanation": "更新并记住 97,240；现在才开始个位块。"
        },
        {
          "title": "算个位块",
          "calculation": "286 × 7",
          "answer": "2002",
          "explanation": "1,400 + 560 + 42 = 2,002。只需要加 2,000 和 2。"
        },
        {
          "title": "加 2,000",
          "calculation": "97240 + 2000",
          "answer": "99240",
          "explanation": "总数更新为 99,240。"
        },
        {
          "title": "最后加 2",
          "calculation": "99240 + 2",
          "answer": "99242",
          "explanation": "全部完成，答案是 99,242。"
        }
      ]
    },
    "drills": [
      {
        "expression": "123 × 234",
        "answer": "28782",
        "explanation": "先记 24,600。十位块 3,690：27,600 → 28,200 → 28,290。个位块 492：28,690 → 28,780 → 28,782。"
      },
      {
        "expression": "248 × 367",
        "answer": "91016",
        "explanation": "先记 74,400。十位块 14,880：84,400 → 88,400 → 89,200 → 89,280。个位块 1,736：90,280 → 90,980 → 91,010 → 91,016。"
      },
      {
        "expression": "367 × 458",
        "answer": "168086",
        "explanation": "先记 146,800。十位块 18,350：156,800 → 164,800 → 165,100 → 165,150。个位块 2,936：167,150 → 168,050 → 168,080 → 168,086。"
      }
    ],
    "multiplicationStage": "triple-general"
  }
];
