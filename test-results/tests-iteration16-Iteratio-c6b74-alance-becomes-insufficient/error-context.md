# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\iteration16.spec.js >> Iteration 16 - Autoplay System >> autoplay stops when balance becomes insufficient
- Location: tests\iteration16.spec.js:70:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).not.toHaveClass(expected) failed

Locator: locator('#autoplay-btn')
Expected pattern: not /running/
Received string: "autoplay-btn running"

Call log:
  - Expect "not toHaveClass" with timeout 30000ms
  - waiting for locator('#autoplay-btn')
    33 × locator resolved to <button id="autoplay-btn" class="autoplay-btn running" title="Click to stop autoplay">…</button>
       - unexpected value "autoplay-btn running"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]: 🦁
      - generic [ref=e5]: Safari Casino
      - button "🔊 Voice" [ref=e6] [cursor=pointer]
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: 💎💎💎
        - generic [ref=e10]: GRAND JACKPOT
        - generic [ref=e11]: 5,240
        - generic [ref=e12]: progressive · hit 💎💎💎 to claim
      - generic [ref=e13]:
        - generic [ref=e14]: 🦁🦁🦁
        - generic [ref=e15]: MAJOR JACKPOT
        - generic [ref=e16]: 50× BET
      - generic [ref=e17]:
        - generic [ref=e18]: 🐆🐆🐆
        - generic [ref=e19]: MINI JACKPOT
        - generic [ref=e20]: 40× BET
    - generic [ref=e21]:
      - generic [ref=e22]:
        - generic [ref=e23]: balance
        - generic [ref=e24]: 7,326
      - generic [ref=e25]:
        - generic [ref=e26]: won
        - generic [ref=e27]: 16,326
      - generic [ref=e28]:
        - generic [ref=e29]: burned
        - generic [ref=e30]: 3,000
      - generic [ref=e31]:
        - generic [ref=e32]: spins
        - generic [ref=e33]: "10"
      - generic [ref=e34]:
        - generic [ref=e35]: session RTP
        - generic [ref=e36]: 163.3%
    - generic [ref=e37]:
      - generic [ref=e38]:
        - generic [ref=e39]: 🐆
        - generic [ref=e40]:
          - generic [ref=e41]: ◈
          - generic [ref=e42]: ◈
          - generic [ref=e43]: ◈
        - generic [ref=e44]: WILD
      - generic [ref=e45]:
        - generic [ref=e46]:
          - generic [ref=e47]: "Add Chips:"
          - button "+100" [ref=e48] [cursor=pointer]
          - button "+500" [ref=e49] [cursor=pointer]
          - button "+1,000" [ref=e50] [cursor=pointer]
          - button "+5,000" [ref=e51] [cursor=pointer]
          - button "Custom ✦" [ref=e52] [cursor=pointer]
        - generic [ref=e53]:
          - generic [ref=e54]:
            - generic [ref=e55]:
              - generic [ref=e56]: "1"
              - generic [ref=e57]: "2"
              - generic [ref=e58]: "3"
            - generic [ref=e59]:
              - generic [ref=e61]:
                - generic [ref=e62]:
                  - generic [ref=e63]: 👑
                  - generic [ref=e64]: CROWN
                - generic [ref=e65]:
                  - generic [ref=e66]: 🌴
                  - generic [ref=e67]: PALM
                - generic [ref=e68]:
                  - generic [ref=e69]: 🌿
                  - generic [ref=e70]: LEAF
                - generic [ref=e71]:
                  - generic [ref=e72]: 🦁
                  - generic [ref=e73]: LION
                - generic [ref=e74]:
                  - generic [ref=e75]: 🌿
                  - generic [ref=e76]: LEAF
                - generic [ref=e77]:
                  - generic [ref=e78]: 🪙
                  - generic [ref=e79]: COIN
                - generic [ref=e80]:
                  - generic [ref=e81]: ⚡
                  - generic [ref=e82]: BOLT
                - generic [ref=e83]:
                  - generic [ref=e84]: 🌿
                  - generic [ref=e85]: LEAF
                - generic [ref=e86]:
                  - generic [ref=e87]: 🪙
                  - generic [ref=e88]: COIN
                - generic [ref=e89]:
                  - generic [ref=e90]: 🔮
                  - generic [ref=e91]: CRYSTAL
                - generic [ref=e92]:
                  - generic [ref=e93]: 🏆
                  - generic [ref=e94]: TROPHY
                - generic [ref=e95]:
                  - generic [ref=e96]: 🏆
                  - generic [ref=e97]: TROPHY
                - generic [ref=e98]:
                  - generic [ref=e99]: 🌴
                  - generic [ref=e100]: PALM
                - generic [ref=e101]:
                  - generic [ref=e102]: 🌴
                  - generic [ref=e103]: PALM
                - generic [ref=e104]:
                  - generic [ref=e105]: 🔮
                  - generic [ref=e106]: CRYSTAL
                - generic [ref=e107]:
                  - generic [ref=e108]: 🔥
                  - generic [ref=e109]: MULTIPLIER
                - generic [ref=e110]:
                  - generic [ref=e111]: 🏆
                  - generic [ref=e112]: TROPHY
                - generic [ref=e113]:
                  - generic [ref=e114]: 🎯
                  - generic [ref=e115]: TARGET
                - generic [ref=e116]:
                  - generic [ref=e117]: 👑
                  - generic [ref=e118]: CROWN
                - generic [ref=e119]:
                  - generic [ref=e120]: 🏅
                  - generic [ref=e121]: MEDAL
                - generic [ref=e122]:
                  - generic [ref=e123]: 👑
                  - generic [ref=e124]: CROWN
                - generic [ref=e125]:
                  - generic [ref=e126]: 🔮
                  - generic [ref=e127]: CRYSTAL
                - generic [ref=e128]:
                  - generic [ref=e129]: 🌿
                  - generic [ref=e130]: LEAF
                - generic [ref=e131]:
                  - generic [ref=e132]: 🐆
                  - generic [ref=e133]: JAGUAR
                - generic [ref=e134]:
                  - generic [ref=e135]: 🦁
                  - generic [ref=e136]: LION
                - generic [ref=e137]:
                  - generic [ref=e138]: 🎯
                  - generic [ref=e139]: TARGET
                - generic [ref=e140]:
                  - generic [ref=e141]: 🐆
                  - generic [ref=e142]: JAGUAR
                - generic [ref=e143]:
                  - generic [ref=e144]: 🐆
                  - generic [ref=e145]: JAGUAR
                - generic [ref=e146]:
                  - generic [ref=e147]: 🔮
                  - generic [ref=e148]: CRYSTAL
                - generic [ref=e149]:
                  - generic [ref=e150]: 🏅
                  - generic [ref=e151]: MEDAL
                - generic [ref=e152]:
                  - generic [ref=e153]: 🏆
                  - generic [ref=e154]: TROPHY
                - generic [ref=e155]:
                  - generic [ref=e156]: 🏆
                  - generic [ref=e157]: TROPHY
                - generic [ref=e158]:
                  - generic [ref=e159]: ⚡
                  - generic [ref=e160]: BOLT
                - generic [ref=e161]:
                  - generic [ref=e162]: 🎯
                  - generic [ref=e163]: TARGET
                - generic [ref=e164]:
                  - generic [ref=e165]: 🎯
                  - generic [ref=e166]: TARGET
                - generic [ref=e167]:
                  - generic [ref=e168]: 🌿
                  - generic [ref=e169]: LEAF
                - generic [ref=e170]:
                  - generic [ref=e171]: 🃏
                  - generic [ref=e172]: WILD
                - generic [ref=e173]:
                  - generic [ref=e174]: ⚡
                  - generic [ref=e175]: BOLT
                - generic [ref=e176]:
                  - generic [ref=e177]: 👑
                  - generic [ref=e178]: CROWN
                - generic [ref=e179]:
                  - generic [ref=e180]: 🏅
                  - generic [ref=e181]: MEDAL
                - generic [ref=e182]:
                  - generic [ref=e183]: 🎯
                  - generic [ref=e184]: TARGET
                - generic [ref=e185]:
                  - generic [ref=e186]: 🌴
                  - generic [ref=e187]: PALM
                - generic [ref=e188]:
                  - generic [ref=e189]: 🏅
                  - generic [ref=e190]: MEDAL
                - generic [ref=e191]:
                  - generic [ref=e192]: ⚡
                  - generic [ref=e193]: BOLT
                - generic [ref=e194]:
                  - generic [ref=e195]: ⚡
                  - generic [ref=e196]: BOLT
                - generic [ref=e197]:
                  - generic [ref=e198]: ⚡
                  - generic [ref=e199]: BOLT
                - generic [ref=e200]:
                  - generic [ref=e201]: 🌴
                  - generic [ref=e202]: PALM
                - generic [ref=e203]:
                  - generic [ref=e204]: ⭐
                  - generic [ref=e205]: SCATTER
                - generic [ref=e206]:
                  - generic [ref=e207]: 🪙
                  - generic [ref=e208]: COIN
                - generic [ref=e209]:
                  - generic [ref=e210]: 🏅
                  - generic [ref=e211]: MEDAL
                - generic [ref=e212]:
                  - generic [ref=e213]: 🪙
                  - generic [ref=e214]: COIN
                - generic [ref=e215]:
                  - generic [ref=e216]: 🪙
                  - generic [ref=e217]: COIN
                - generic [ref=e218]:
                  - generic [ref=e219]: 🏆
                  - generic [ref=e220]: TROPHY
                - generic [ref=e221]:
                  - generic [ref=e222]: 💎
                  - generic [ref=e223]: DIAMOND
                - generic [ref=e224]:
                  - generic [ref=e225]: 🌿
                  - generic [ref=e226]: LEAF
                - generic [ref=e227]:
                  - generic [ref=e228]: 👑
                  - generic [ref=e229]: CROWN
                - generic [ref=e230]:
                  - generic [ref=e231]: 🌴
                  - generic [ref=e232]: PALM
              - generic [ref=e234]:
                - generic [ref=e235]:
                  - generic [ref=e236]: 👑
                  - generic [ref=e237]: CROWN
                - generic [ref=e238]:
                  - generic [ref=e239]: 🌴
                  - generic [ref=e240]: PALM
                - generic [ref=e241]:
                  - generic [ref=e242]: 🌿
                  - generic [ref=e243]: LEAF
                - generic [ref=e244]:
                  - generic [ref=e245]: 🦁
                  - generic [ref=e246]: LION
                - generic [ref=e247]:
                  - generic [ref=e248]: 🌿
                  - generic [ref=e249]: LEAF
                - generic [ref=e250]:
                  - generic [ref=e251]: 🪙
                  - generic [ref=e252]: COIN
                - generic [ref=e253]:
                  - generic [ref=e254]: ⚡
                  - generic [ref=e255]: BOLT
                - generic [ref=e256]:
                  - generic [ref=e257]: 🌿
                  - generic [ref=e258]: LEAF
                - generic [ref=e259]:
                  - generic [ref=e260]: 🪙
                  - generic [ref=e261]: COIN
                - generic [ref=e262]:
                  - generic [ref=e263]: 🔮
                  - generic [ref=e264]: CRYSTAL
                - generic [ref=e265]:
                  - generic [ref=e266]: 🏆
                  - generic [ref=e267]: TROPHY
                - generic [ref=e268]:
                  - generic [ref=e269]: 🏆
                  - generic [ref=e270]: TROPHY
                - generic [ref=e271]:
                  - generic [ref=e272]: 🌴
                  - generic [ref=e273]: PALM
                - generic [ref=e274]:
                  - generic [ref=e275]: 🌴
                  - generic [ref=e276]: PALM
                - generic [ref=e277]:
                  - generic [ref=e278]: 🔮
                  - generic [ref=e279]: CRYSTAL
                - generic [ref=e280]:
                  - generic [ref=e281]: 🔥
                  - generic [ref=e282]: MULTIPLIER
                - generic [ref=e283]:
                  - generic [ref=e284]: 🏆
                  - generic [ref=e285]: TROPHY
                - generic [ref=e286]:
                  - generic [ref=e287]: 🎯
                  - generic [ref=e288]: TARGET
                - generic [ref=e289]:
                  - generic [ref=e290]: 👑
                  - generic [ref=e291]: CROWN
                - generic [ref=e292]:
                  - generic [ref=e293]: 🏅
                  - generic [ref=e294]: MEDAL
                - generic [ref=e295]:
                  - generic [ref=e296]: 👑
                  - generic [ref=e297]: CROWN
                - generic [ref=e298]:
                  - generic [ref=e299]: 🔮
                  - generic [ref=e300]: CRYSTAL
                - generic [ref=e301]:
                  - generic [ref=e302]: 🌿
                  - generic [ref=e303]: LEAF
                - generic [ref=e304]:
                  - generic [ref=e305]: 🐆
                  - generic [ref=e306]: JAGUAR
                - generic [ref=e307]:
                  - generic [ref=e308]: 🦁
                  - generic [ref=e309]: LION
                - generic [ref=e310]:
                  - generic [ref=e311]: 🎯
                  - generic [ref=e312]: TARGET
                - generic [ref=e313]:
                  - generic [ref=e314]: 🐆
                  - generic [ref=e315]: JAGUAR
                - generic [ref=e316]:
                  - generic [ref=e317]: 🐆
                  - generic [ref=e318]: JAGUAR
                - generic [ref=e319]:
                  - generic [ref=e320]: 🔮
                  - generic [ref=e321]: CRYSTAL
                - generic [ref=e322]:
                  - generic [ref=e323]: 🏅
                  - generic [ref=e324]: MEDAL
                - generic [ref=e325]:
                  - generic [ref=e326]: 🏆
                  - generic [ref=e327]: TROPHY
                - generic [ref=e328]:
                  - generic [ref=e329]: 🏆
                  - generic [ref=e330]: TROPHY
                - generic [ref=e331]:
                  - generic [ref=e332]: ⚡
                  - generic [ref=e333]: BOLT
                - generic [ref=e334]:
                  - generic [ref=e335]: 🎯
                  - generic [ref=e336]: TARGET
                - generic [ref=e337]:
                  - generic [ref=e338]: 🎯
                  - generic [ref=e339]: TARGET
                - generic [ref=e340]:
                  - generic [ref=e341]: 🌿
                  - generic [ref=e342]: LEAF
                - generic [ref=e343]:
                  - generic [ref=e344]: 🃏
                  - generic [ref=e345]: WILD
                - generic [ref=e346]:
                  - generic [ref=e347]: ⚡
                  - generic [ref=e348]: BOLT
                - generic [ref=e349]:
                  - generic [ref=e350]: 👑
                  - generic [ref=e351]: CROWN
                - generic [ref=e352]:
                  - generic [ref=e353]: 🏅
                  - generic [ref=e354]: MEDAL
                - generic [ref=e355]:
                  - generic [ref=e356]: 🎯
                  - generic [ref=e357]: TARGET
                - generic [ref=e358]:
                  - generic [ref=e359]: 🌴
                  - generic [ref=e360]: PALM
                - generic [ref=e361]:
                  - generic [ref=e362]: 🏅
                  - generic [ref=e363]: MEDAL
                - generic [ref=e364]:
                  - generic [ref=e365]: ⚡
                  - generic [ref=e366]: BOLT
                - generic [ref=e367]:
                  - generic [ref=e368]: ⚡
                  - generic [ref=e369]: BOLT
                - generic [ref=e370]:
                  - generic [ref=e371]: ⚡
                  - generic [ref=e372]: BOLT
                - generic [ref=e373]:
                  - generic [ref=e374]: 🌴
                  - generic [ref=e375]: PALM
                - generic [ref=e376]:
                  - generic [ref=e377]: ⭐
                  - generic [ref=e378]: SCATTER
                - generic [ref=e379]:
                  - generic [ref=e380]: 🪙
                  - generic [ref=e381]: COIN
                - generic [ref=e382]:
                  - generic [ref=e383]: 🏅
                  - generic [ref=e384]: MEDAL
                - generic [ref=e385]:
                  - generic [ref=e386]: 🪙
                  - generic [ref=e387]: COIN
                - generic [ref=e388]:
                  - generic [ref=e389]: 🪙
                  - generic [ref=e390]: COIN
                - generic [ref=e391]:
                  - generic [ref=e392]: 🏆
                  - generic [ref=e393]: TROPHY
                - generic [ref=e394]:
                  - generic [ref=e395]: 💎
                  - generic [ref=e396]: DIAMOND
                - generic [ref=e397]:
                  - generic [ref=e398]: 🌿
                  - generic [ref=e399]: LEAF
                - generic [ref=e400]:
                  - generic [ref=e401]: 👑
                  - generic [ref=e402]: CROWN
                - generic [ref=e403]:
                  - generic [ref=e404]: 🌴
                  - generic [ref=e405]: PALM
              - generic [ref=e407]:
                - generic [ref=e408]:
                  - generic [ref=e409]: 👑
                  - generic [ref=e410]: CROWN
                - generic [ref=e411]:
                  - generic [ref=e412]: 🌴
                  - generic [ref=e413]: PALM
                - generic [ref=e414]:
                  - generic [ref=e415]: 🌿
                  - generic [ref=e416]: LEAF
                - generic [ref=e417]:
                  - generic [ref=e418]: 🦁
                  - generic [ref=e419]: LION
                - generic [ref=e420]:
                  - generic [ref=e421]: 🌿
                  - generic [ref=e422]: LEAF
                - generic [ref=e423]:
                  - generic [ref=e424]: 🪙
                  - generic [ref=e425]: COIN
                - generic [ref=e426]:
                  - generic [ref=e427]: ⚡
                  - generic [ref=e428]: BOLT
                - generic [ref=e429]:
                  - generic [ref=e430]: 🌿
                  - generic [ref=e431]: LEAF
                - generic [ref=e432]:
                  - generic [ref=e433]: 🪙
                  - generic [ref=e434]: COIN
                - generic [ref=e435]:
                  - generic [ref=e436]: 🔮
                  - generic [ref=e437]: CRYSTAL
                - generic [ref=e438]:
                  - generic [ref=e439]: 🏆
                  - generic [ref=e440]: TROPHY
                - generic [ref=e441]:
                  - generic [ref=e442]: 🏆
                  - generic [ref=e443]: TROPHY
                - generic [ref=e444]:
                  - generic [ref=e445]: 🌴
                  - generic [ref=e446]: PALM
                - generic [ref=e447]:
                  - generic [ref=e448]: 🌴
                  - generic [ref=e449]: PALM
                - generic [ref=e450]:
                  - generic [ref=e451]: 🔮
                  - generic [ref=e452]: CRYSTAL
                - generic [ref=e453]:
                  - generic [ref=e454]: 🔥
                  - generic [ref=e455]: MULTIPLIER
                - generic [ref=e456]:
                  - generic [ref=e457]: 🏆
                  - generic [ref=e458]: TROPHY
                - generic [ref=e459]:
                  - generic [ref=e460]: 🎯
                  - generic [ref=e461]: TARGET
                - generic [ref=e462]:
                  - generic [ref=e463]: 👑
                  - generic [ref=e464]: CROWN
                - generic [ref=e465]:
                  - generic [ref=e466]: 🏅
                  - generic [ref=e467]: MEDAL
                - generic [ref=e468]:
                  - generic [ref=e469]: 👑
                  - generic [ref=e470]: CROWN
                - generic [ref=e471]:
                  - generic [ref=e472]: 🔮
                  - generic [ref=e473]: CRYSTAL
                - generic [ref=e474]:
                  - generic [ref=e475]: 🌿
                  - generic [ref=e476]: LEAF
                - generic [ref=e477]:
                  - generic [ref=e478]: 🐆
                  - generic [ref=e479]: JAGUAR
                - generic [ref=e480]:
                  - generic [ref=e481]: 🦁
                  - generic [ref=e482]: LION
                - generic [ref=e483]:
                  - generic [ref=e484]: 🎯
                  - generic [ref=e485]: TARGET
                - generic [ref=e486]:
                  - generic [ref=e487]: 🐆
                  - generic [ref=e488]: JAGUAR
                - generic [ref=e489]:
                  - generic [ref=e490]: 🐆
                  - generic [ref=e491]: JAGUAR
                - generic [ref=e492]:
                  - generic [ref=e493]: 🔮
                  - generic [ref=e494]: CRYSTAL
                - generic [ref=e495]:
                  - generic [ref=e496]: 🏅
                  - generic [ref=e497]: MEDAL
                - generic [ref=e498]:
                  - generic [ref=e499]: 🏆
                  - generic [ref=e500]: TROPHY
                - generic [ref=e501]:
                  - generic [ref=e502]: 🏆
                  - generic [ref=e503]: TROPHY
                - generic [ref=e504]:
                  - generic [ref=e505]: ⚡
                  - generic [ref=e506]: BOLT
                - generic [ref=e507]:
                  - generic [ref=e508]: 🎯
                  - generic [ref=e509]: TARGET
                - generic [ref=e510]:
                  - generic [ref=e511]: 🎯
                  - generic [ref=e512]: TARGET
                - generic [ref=e513]:
                  - generic [ref=e514]: 🌿
                  - generic [ref=e515]: LEAF
                - generic [ref=e516]:
                  - generic [ref=e517]: 🃏
                  - generic [ref=e518]: WILD
                - generic [ref=e519]:
                  - generic [ref=e520]: ⚡
                  - generic [ref=e521]: BOLT
                - generic [ref=e522]:
                  - generic [ref=e523]: 👑
                  - generic [ref=e524]: CROWN
                - generic [ref=e525]:
                  - generic [ref=e526]: 🏅
                  - generic [ref=e527]: MEDAL
                - generic [ref=e528]:
                  - generic [ref=e529]: 🎯
                  - generic [ref=e530]: TARGET
                - generic [ref=e531]:
                  - generic [ref=e532]: 🌴
                  - generic [ref=e533]: PALM
                - generic [ref=e534]:
                  - generic [ref=e535]: 🏅
                  - generic [ref=e536]: MEDAL
                - generic [ref=e537]:
                  - generic [ref=e538]: ⚡
                  - generic [ref=e539]: BOLT
                - generic [ref=e540]:
                  - generic [ref=e541]: ⚡
                  - generic [ref=e542]: BOLT
                - generic [ref=e543]:
                  - generic [ref=e544]: ⚡
                  - generic [ref=e545]: BOLT
                - generic [ref=e546]:
                  - generic [ref=e547]: 🌴
                  - generic [ref=e548]: PALM
                - generic [ref=e549]:
                  - generic [ref=e550]: ⭐
                  - generic [ref=e551]: SCATTER
                - generic [ref=e552]:
                  - generic [ref=e553]: 🪙
                  - generic [ref=e554]: COIN
                - generic [ref=e555]:
                  - generic [ref=e556]: 🏅
                  - generic [ref=e557]: MEDAL
                - generic [ref=e558]:
                  - generic [ref=e559]: 🪙
                  - generic [ref=e560]: COIN
                - generic [ref=e561]:
                  - generic [ref=e562]: 🪙
                  - generic [ref=e563]: COIN
                - generic [ref=e564]:
                  - generic [ref=e565]: 🏆
                  - generic [ref=e566]: TROPHY
                - generic [ref=e567]:
                  - generic [ref=e568]: 💎
                  - generic [ref=e569]: DIAMOND
                - generic [ref=e570]:
                  - generic [ref=e571]: 🌿
                  - generic [ref=e572]: LEAF
                - generic [ref=e573]:
                  - generic [ref=e574]: 👑
                  - generic [ref=e575]: CROWN
                - generic [ref=e576]:
                  - generic [ref=e577]: 🌴
                  - generic [ref=e578]: PALM
            - generic [ref=e579]:
              - generic [ref=e580]: "1"
              - generic [ref=e581]: "2"
              - generic [ref=e582]: "3"
          - generic [ref=e583]:
            - text: A small bounty from the jungle. +1,332 chips!
            - generic [ref=e584]: "[LINES 1+3]"
          - generic [ref=e585]:
            - button "⚡ Fast Spin" [ref=e586] [cursor=pointer]
            - button "▶ Spin" [ref=e587] [cursor=pointer]
            - button "⏹ Stop 40 left" [ref=e588] [cursor=pointer]:
              - text: ⏹ Stop
              - generic [ref=e589]: 40 left
            - button "↺ Refill" [ref=e590] [cursor=pointer]
            - button "📋 Paytable" [ref=e591] [cursor=pointer]
          - generic [ref=e592]:
            - generic [ref=e593]: "Bet:"
            - button "−" [ref=e594] [cursor=pointer]
            - spinbutton [ref=e595]: "1000"
            - button "+" [ref=e596] [cursor=pointer]
            - generic [ref=e597]: chips
          - generic [ref=e599]:
            - button "5" [ref=e600] [cursor=pointer]
            - button "10" [ref=e601] [cursor=pointer]
            - button "25" [ref=e602] [cursor=pointer]
            - button "50" [ref=e603] [cursor=pointer]
            - button "100" [ref=e604] [cursor=pointer]
            - button "250" [ref=e605] [cursor=pointer]
            - button "MAX" [ref=e606] [cursor=pointer]
      - generic [ref=e607]:
        - generic [ref=e608]: PULL
        - generic "Pull the lever to spin!" [ref=e609] [cursor=pointer]
        - generic [ref=e615]: ▼
      - generic [ref=e616]:
        - generic [ref=e617]: 🐆
        - generic [ref=e618]:
          - generic [ref=e619]: ◈
          - generic [ref=e620]: ◈
          - generic [ref=e621]: ◈
        - generic [ref=e622]: HUNT
  - generic [ref=e623]:
    - button "📜 History" [ref=e624] [cursor=pointer]
    - button "📊 Stats" [ref=e625] [cursor=pointer]
  - button "⚙ Settings" [ref=e627] [cursor=pointer]
  - generic:
    - generic:
      - generic: 🪙 Add Chips
      - generic:
        - button "+100 🪙"
        - button "+500 🪙"
        - button "+1,000 🪙"
        - button "+5,000 🪙"
        - button "+10,000 🪙"
        - button "+50,000 🪙"
      - generic:
        - spinbutton
        - button "Add"
      - button "Cancel"
  - generic:
    - generic:
      - generic: "📋 Paytable — 3 Active Paylines — RTP: 96.50%"
      - generic: Payouts apply to bet÷3 per line. Multiple lines can win simultaneously.
      - generic:
        - generic: 💎💎💎 Diamond Jackpot + PROGRESSIVE
        - generic: ×150 + POOL
      - generic:
        - generic: 🦁🦁🦁 Lion Pride
        - generic: ×50
      - generic:
        - generic: 🐆🐆🐆 Jaguar Hunt
        - generic: ×40
      - generic:
        - generic: 👑👑👑 Royal Flush
        - generic: ×30
      - generic:
        - generic: 🪙🪙🪙 Gold Rush
        - generic: ×25
      - generic:
        - generic: 💎🦁🐆 Safari Trio
        - generic: ×25
      - generic:
        - generic: 💎🐆👑 Royal Hunt
        - generic: ×18
      - generic:
        - generic: 🦁🐆👑 Jungle Crown
        - generic: ×15
      - generic:
        - generic: Any 3 of a kind
        - generic: ×15
      - generic:
        - generic: 👑🪙🏆 Golden Empire
        - generic: ×12
      - generic:
        - generic: 🐆⚡🎯 Wild Safari
        - generic: ×10
      - generic:
        - generic: Any 2 of a kind
        - generic: ×2
      - generic:
        - generic: No match
        - generic: burned
      - generic:
        - generic: 🃏 WILD — substitutes for any regular symbol
        - generic: completes combos
      - generic:
        - generic: ⭐⭐ Scatter ×2 (pays anywhere)
        - generic: ×5
      - generic:
        - generic: ⭐⭐⭐ Scatter ×3 + FREE SPINS
        - generic: ×20 + 3 free
      - generic:
        - generic: 🔥 Multiplier — doubles any win it appears in
        - generic: ×2 boost
      - button "Close ×"
  - generic:
    - generic:
      - generic: ⚡ Fast Spin
      - generic: Speed up the reel animation. Results and payouts are identical — only the wait gets shorter.
      - generic:
        - button "Normal 1×"
        - button "Fast 2×"
        - button "Turbo 3×"
      - button "Cancel"
  - generic:
    - generic:
      - generic: ▶▶ Autoplay
      - generic: Pick how many spins to run automatically. Autoplay stops when you run out of spins or chips.
      - generic:
        - button "5 spins"
        - button "10 spins"
        - button "25 spins"
        - button "50 spins"
        - button "100 spins"
        - button "250 spins"
      - generic:
        - spinbutton [active]
        - button "Start"
      - button "Cancel"
  - generic [ref=e629]:
    - generic [ref=e630]: 🎡 BONUS WHEEL
    - generic [ref=e631]: "SPIN #10"
    - button "🎰 SPIN THE WHEEL" [ref=e636] [cursor=pointer]
  - generic:
    - generic:
      - generic: 📜 Spin History
      - generic: No spins yet. Start playing to build your history.
      - button "Close ×"
  - generic:
    - generic:
      - generic: 📊 Session Stats
      - generic:
        - generic:
          - generic: Total Spins
          - generic: "0"
        - generic:
          - generic: Average Bet
          - generic: —
        - generic:
          - generic: Biggest Win
          - generic: "0"
        - generic:
          - generic: Total Won
          - generic: "0"
        - generic:
          - generic: Total Burned
          - generic: "0"
        - generic:
          - generic: Net Profit
          - generic: "0"
      - button "Close ×"
  - generic:
    - generic:
      - generic: ⚙ Settings
      - generic:
        - generic: Sound
        - generic:
          - checkbox "🔊 Sound Effects Spin, win, and loss sounds" [checked]
          - generic: 🔊 Sound Effects
          - generic: Spin, win, and loss sounds
        - generic:
          - checkbox "🎙 Voiceover Spoken commentary during gameplay" [checked]
          - generic: 🎙 Voiceover
          - generic: Spoken commentary during gameplay
      - generic:
        - generic: Controls
        - generic:
          - checkbox "⌨ Keyboard Controls Press Space or Enter to spin"
          - generic: ⌨ Keyboard Controls
          - generic: Press Space or Enter to spin
      - button "Close ×"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { resolve } from 'path';
  3   | import { pathToFileURL } from 'url';
  4   | 
  5   | const PAGE_URL = pathToFileURL(
  6   |   resolve(__dirname, '..', 'src', 'iterations', 'iteration16', 'index.html')
  7   | ).href;
  8   | 
  9   | async function waitForSpinComplete(page) {
  10  |   await expect(page.locator('#spin-btn')).toBeEnabled({ timeout: 8000 });
  11  | }
  12  | 
  13  | async function dismissBonusIfPresent(page) {
  14  |   const bonusModal = page.locator('#bonus-modal');
  15  |   if (await bonusModal.evaluate((el) => el.classList.contains('show')).catch(() => false)) {
  16  |     const wheelBtn = page.locator('#wheel-spin-btn');
  17  |     if (await wheelBtn.isVisible().catch(() => false)) {
  18  |       await wheelBtn.click();
  19  |     }
  20  |     const closeBtn = page.locator('#wheel-close-btn');
  21  |     await closeBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  22  |     if (await closeBtn.isVisible().catch(() => false)) {
  23  |       await closeBtn.click();
  24  |     }
  25  |   }
  26  | }
  27  | 
  28  | test.beforeEach(async ({ page }) => {
  29  |   await page.goto(PAGE_URL);
  30  |   await page.evaluate(() => localStorage.clear());
  31  |   await page.reload();
  32  |   await page.waitForSelector('#spin-btn');
  33  |   await page.waitForSelector('#autoplay-btn');
  34  | });
  35  | 
  36  | test.describe('Iteration 16 - Autoplay System', () => {
  37  |   test('autoplay button opens the autoplay modal', async ({ page }) => {
  38  |     const modal = page.locator('#autoplay-modal');
  39  |     await expect(modal).not.toHaveClass(/show/);
  40  | 
  41  |     await page.locator('#autoplay-btn').click();
  42  | 
  43  |     await expect(modal).toHaveClass(/show/);
  44  |     await expect(page.locator('.autoplay-preset[data-count="5"]')).toBeVisible();
  45  |   });
  46  | 
  47  |   test('selecting a preset starts autoplay and updates the button', async ({ page }) => {
  48  |     await page.locator('#autoplay-btn').click();
  49  |     await page.locator('.autoplay-preset[data-count="5"]').click();
  50  | 
  51  |     const autoplayBtn = page.locator('#autoplay-btn');
  52  |     await expect(autoplayBtn).toHaveClass(/running/);
  53  |     await expect(autoplayBtn).toContainText('Stop');
  54  |     await expect(autoplayBtn).toContainText('left');
  55  |   });
  56  | 
  57  |   test('autoplay stops when the stop button is pressed', async ({ page }) => {
  58  |     await page.locator('#autoplay-btn').click();
  59  |     await page.locator('.autoplay-preset[data-count="25"]').click();
  60  | 
  61  |     const autoplayBtn = page.locator('#autoplay-btn');
  62  |     await expect(autoplayBtn).toHaveClass(/running/);
  63  | 
  64  |     await autoplayBtn.click();
  65  | 
  66  |     await expect(autoplayBtn).not.toHaveClass(/running/, { timeout: 5000 });
  67  |     await expect(autoplayBtn).toContainText('Autoplay');
  68  |   });
  69  | 
  70  |   test('autoplay stops when balance becomes insufficient', async ({ page }) => {
  71  |     await page.locator('.bet-preset[data-bet="max"]').click();
  72  |     await expect(page.locator('#bet')).toHaveValue('1000');
  73  | 
  74  |     await page.locator('#autoplay-btn').click();
  75  |     await page.locator('.autoplay-preset[data-count="50"]').click();
  76  | 
  77  |     const autoplayBtn = page.locator('#autoplay-btn');
> 78  |     await expect(autoplayBtn).not.toHaveClass(/running/, { timeout: 30000 });
      |                                   ^ Error: expect(locator).not.toHaveClass(expected) failed
  79  | 
  80  |     const balance = await page.locator('#balance').textContent();
  81  |     const balanceNum = parseInt(balance.replace(/,/g, ''), 10);
  82  |     const spins = parseInt((await page.locator('#spins').textContent()).replace(/,/g, ''), 10);
  83  |     expect(spins).toBeGreaterThan(0);
  84  |     expect(spins).toBeLessThan(50);
  85  |     expect(balanceNum).toBeLessThan(1000);
  86  |   });
  87  | 
  88  |   test('autoplay does not allow multiple concurrent runs', async ({ page }) => {
  89  |     await page.locator('#autoplay-btn').click();
  90  |     await page.locator('.autoplay-preset[data-count="10"]').click();
  91  | 
  92  |     const autoplayBtn = page.locator('#autoplay-btn');
  93  |     await expect(autoplayBtn).toHaveClass(/running/);
  94  | 
  95  |     const modal = page.locator('#autoplay-modal');
  96  |     await expect(modal).not.toHaveClass(/show/);
  97  | 
  98  |     await autoplayBtn.click();
  99  |     await expect(modal).not.toHaveClass(/show/);
  100 |     await expect(autoplayBtn).not.toHaveClass(/running/);
  101 |   });
  102 | });
  103 | 
  104 | test.describe('Iteration 16 - Fast Spin / Speed Control', () => {
  105 |   test('default spin speed is 1x and Fast Spin button shows default label', async ({ page }) => {
  106 |     const fastBtn = page.locator('#fast-spin-btn');
  107 |     await expect(fastBtn).toHaveAttribute('data-speed', '1');
  108 |     await expect(fastBtn).not.toHaveClass(/active/);
  109 |     await expect(fastBtn.locator('.fast-spin-btn-label')).toHaveText('Fast Spin');
  110 |   });
  111 | 
  112 |   test('clicking Fast Spin button opens the speed-chooser modal', async ({ page }) => {
  113 |     const modal = page.locator('#fast-spin-modal');
  114 |     await expect(modal).not.toHaveClass(/show/);
  115 | 
  116 |     await page.locator('#fast-spin-btn').click();
  117 | 
  118 |     await expect(modal).toHaveClass(/show/);
  119 |     await expect(page.locator('.fast-spin-preset[data-speed="2"]')).toBeVisible();
  120 |     await expect(page.locator('.fast-spin-preset[data-speed="3"]')).toBeVisible();
  121 |   });
  122 | 
  123 |   test('selecting Fast 2x updates button state and closes modal', async ({ page }) => {
  124 |     await page.locator('#fast-spin-btn').click();
  125 |     await page.locator('.fast-spin-preset[data-speed="2"]').click();
  126 | 
  127 |     const fastBtn = page.locator('#fast-spin-btn');
  128 |     await expect(page.locator('#fast-spin-modal')).not.toHaveClass(/show/);
  129 |     await expect(fastBtn).toHaveAttribute('data-speed', '2');
  130 |     await expect(fastBtn).toHaveClass(/active/);
  131 |     await expect(fastBtn.locator('.fast-spin-btn-label')).toContainText('2');
  132 |   });
  133 | 
  134 |   test('Turbo 3x is reflected in the speed selector', async ({ page }) => {
  135 |     await page.locator('#fast-spin-btn').click();
  136 |     await page.locator('.fast-spin-preset[data-speed="3"]').click();
  137 | 
  138 |     const fastBtn = page.locator('#fast-spin-btn');
  139 |     await expect(fastBtn).toHaveAttribute('data-speed', '3');
  140 |     await expect(fastBtn.locator('.fast-spin-btn-label')).toContainText('3');
  141 |   });
  142 | 
  143 |   test('fast spin shortens spin duration vs default speed', async ({ page }) => {
  144 |     const startNormal = Date.now();
  145 |     await page.locator('#spin-btn').click();
  146 |     await waitForSpinComplete(page);
  147 |     const normalDuration = Date.now() - startNormal;
  148 | 
  149 |     await dismissBonusIfPresent(page);
  150 | 
  151 |     await page.locator('#fast-spin-btn').click();
  152 |     await page.locator('.fast-spin-preset[data-speed="3"]').click();
  153 | 
  154 |     const startTurbo = Date.now();
  155 |     await page.locator('#spin-btn').click();
  156 |     await waitForSpinComplete(page);
  157 |     const turboDuration = Date.now() - startTurbo;
  158 | 
  159 |     expect(turboDuration).toBeLessThan(normalDuration);
  160 |   });
  161 | 
  162 |   test('fast spin works with autoplay (turbo speed reflected during autoplay)', async ({ page }) => {
  163 |     await page.locator('#fast-spin-btn').click();
  164 |     await page.locator('.fast-spin-preset[data-speed="3"]').click();
  165 |     await expect(page.locator('#fast-spin-btn')).toHaveAttribute('data-speed', '3');
  166 | 
  167 |     await page.locator('#autoplay-btn').click();
  168 |     await page.locator('.autoplay-preset[data-count="5"]').click();
  169 | 
  170 |     const autoplayBtn = page.locator('#autoplay-btn');
  171 |     await expect(autoplayBtn).toHaveClass(/running/);
  172 |     await expect(page.locator('#fast-spin-btn')).toHaveAttribute('data-speed', '3');
  173 | 
  174 |     await autoplayBtn.click();
  175 |     await expect(autoplayBtn).not.toHaveClass(/running/, { timeout: 5000 });
  176 |   });
  177 | });
  178 | 
```