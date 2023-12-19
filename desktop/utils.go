package desktop

import (
	"encoding/json"
	"regexp"
	"strings"
)

type MatchResult struct {
	Params  map[string]string `json:"params"`
	Match   bool              `json:"match"`
	Origin  string            `json:"origin"`
	Pattern string            `json:"pattern"`
}

func (r *MatchResult) String() string {
	b, err := json.Marshal(r)
	if err != nil {
		return ""
	}
	return string(b)
}

func (r *MatchResult) GetParam(key string) string {
	return r.Params[key]
}

func ParseKey(pattern string) string {
	index := strings.Index(pattern, "/:")
	if index < 0 || index > len(pattern)-2 {
		return ""
	}
	str := pattern[index+1:]
	end := strings.Index(str, "/")
	if end == -1 {
		end = len(str)
	}
	key := str[0:end]
	return key
}

// ParsePathParam 解析路径中的 :id 字段
func ParsePathParam(path string, pattern string) *MatchResult {

	var result = &MatchResult{
		Match:  false,
		Params: map[string]string{},
		Origin: path,
	}
	var keys []string
	var reg = pattern
	for i := 0; true; i++ {
		key := ParseKey(reg)
		if len(key) == 0 {
			break
		}
		keys = append(keys, key[1:])
		reg = strings.ReplaceAll(reg, key, "(.+)?")
	}

	result.Pattern = reg

	compile := regexp.MustCompile(reg)
	match := compile.FindStringSubmatch(path)
	if len(match) < 1 {
		return result
	}
	result.Match = true
	for i := 1; i < len(match); i++ {
		k := keys[i-1]
		result.Params[k] = match[i]
	}
	return result
}
