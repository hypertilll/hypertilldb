#pragma once

#import <React/RCTBridge+Private.h>

#ifdef __cplusplus
extern "C"
{
#endif

void installHypertillJSI(RCTCxxBridge *bridge);
void hypertilldbProvideSyncJson(int id, NSData *json, NSError **errorPtr);

#ifdef __cplusplus
} // extern "C"
#endif
